import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs/promises';
import * as path from 'path';

import { __dirname } from './constants/helper.js';
import { FourDResult, TotoResult, WinningShare } from './models/Toto.js';
import { initializeTotoDatabase, saveTotoToDatabase } from './utils/database/helper.js';

function processITOTOString(input: string, processedSentences: string[]) {
    // Split the input string by "iTOTO - System" to separate different systems
    const systemSplit = input.split(/iTOTO - System \d+/).filter(s => s.trim());
    let currentSystem = "";

    // Process each system part
    for (let i = 0; i < systemSplit.length; i++) {
        // Extract the system number from the original string
        const systemMatch = input.match(new RegExp(`iTOTO - System (\\d+)${systemSplit[i].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
        if (systemMatch) {
            currentSystem = `iTOTO - System ${systemMatch[1]}`;
        }

        // Split each part by bullet points and process
        const entries = systemSplit[i].split('•').map(s => s.trim()).filter(s => s);
        for (const entry of entries) {
            processedSentences.push(`${entry} (${currentSystem})`);
        }
    }
}

function extractAddresses(text: string): string[] {
    // Remove extra whitespace and newlines
    // const cleanedText: string = text.replace(/[\n\r]+/g, ' ').trim();
    const cleanedText: string = text.replace(/\s+/g, ' ').trim();

    console.log('-------------cleanedText----------------')
    console.log(cleanedText);
    console.log('-------------------------------------')

    // Split the text into sentences
    // const rawSentences: string[] = cleanedText.split(/(?<=\))/);
    const rawSentences: string[] = cleanedText.split(/(?<=Entry \))/);;
    const processedSentences: string[] = [];
    for (let i = 0; i < rawSentences.length; i++) {
        let sentence = rawSentences[i].trim();

        // Filter out empty sentences
        if (sentence.length > 0) {
            // Clean up each sentence
            sentence = sentence.replace(/^\s*-\s*/, '').trim();
            if (sentence.startsWith('iTOTO - System')) processITOTOString(sentence, processedSentences);
            else processedSentences.push(sentence);
        }
    }

    return processedSentences;
}

function extractFirstTwoWords(text: string): string {
    // Remove leading and trailing whitespace
    const trimmedText = text.trim();

    // Split the text into words
    const words = trimmedText.split(/\s+/);

    // Return the first two words, or the whole string if less than two words
    return words.slice(0, 2).join(' ');
}

async function fetchHtml(url: string): Promise<string> {
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        return response.data;
    } catch (error) {
        console.error(`Error fetching URL ${url}:`, error);
        throw error;
    }
}

// Scraping function for TOTO
async function scrapeToto(): Promise<TotoResult> {
    // const url = 'https://www.singaporepools.com.sg/en/product/sr/Pages/toto_results.aspx';
    // const url = 'https://www.singaporepools.com.sg/en/product/sr/Pages/toto_results.aspx?sppl=RHJhd051bWJlcj0zOTk2';
    // const url = 'https://www.singaporepools.com.sg/en/product/sr/Pages/toto_results.aspx?sppl=RHJhd051bWJlcj0zNzEw';
    // const url = 'https://www.singaporepools.com.sg/en/product/sr/Pages/toto_results.aspx?sppl=RHJhd051bWJlcj0zNjg1';
    const url = 'https://www.singaporepools.com.sg/en/product/sr/Pages/toto_results.aspx?sppl=RHJhd051bWJlcj0zOTcy';
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    const result: TotoResult = {
        date: '',
        drawNo: '',
        winningNumbers: [],
        additionalNumber: '',
        group1Prize: '',
        winningShares: {
            'Group 1': {
                shareAmount: '',
                numberOfWinningShares: '',
                soldAt: []
            },
            'Group 2': {
                shareAmount: '',
                numberOfWinningShares: '',
                soldAt: []
            },
            'Group 3': {
                shareAmount: '',
                numberOfWinningShares: '',
                soldAt: []
            },
            'Group 4': {
                shareAmount: '',
                numberOfWinningShares: '',
                soldAt: []
            },
            'Group 5': {
                shareAmount: '',
                numberOfWinningShares: '',
                soldAt: []
            },
            'Group 6': {
                shareAmount: '',
                numberOfWinningShares: '',
                soldAt: []
            },
            'Group 7': {
                shareAmount: '',
                numberOfWinningShares: '',
                soldAt: []
            }
        }
    };

    // Extract date and draw number
    const drawInfo = $('.tables-wrap .table:first-child').text();
    const dateMatch = drawInfo.match(/(\w{3}, \d{2} \w{3} \d{4})/);
    const drawNoMatch = drawInfo.match(/Draw No\. (\d+)/);
    result.date = dateMatch ? dateMatch[1] : '';
    result.drawNo = drawNoMatch ? drawNoMatch[1] : '';

    // Extract winning numbers
    $('.tables-wrap .table:nth-child(2) td').each((_, el) => {
        result.winningNumbers.push($(el).text().trim());
    });

    // Extract additional number
    result.additionalNumber = $('.tables-wrap .table:nth-child(3) td').text().trim();

    // Extract Group 1 Prize
    result.group1Prize = $('.tables-wrap .table:nth-child(4) td').text().trim();

    // Extract winning shares
    $('.tables-wrap .table:last-child tbody tr').each((_, row) => {
        const columns = $(row).find('td');
        if (columns.length >= 3) {
            const prizeGroup: string = columns.eq(0).text().trim();
            const shareAmount: string = columns.eq(1).text().trim();
            const numberOfWinningShares: string = columns.eq(2).text().trim();

            const winningShare: WinningShare = {
                shareAmount: shareAmount,
                numberOfWinningShares: numberOfWinningShares,
                soldAt: []
            }

            result.winningShares[prizeGroup] = winningShare;
        }
    });

    // Extract soldAt information from divWinningOutlets
    const winningOutletsDiv = $('.divWinningOutlets');
    let currentGroup = '';
    let toExtract: boolean = false;
    winningOutletsDiv.children().each((_, element) => {
        const text = $(element).text().trim();
        // console.log(`|${text}|`);

        // Extract the addresses
        if (toExtract) {
            console.log(`Extracting ${currentGroup} address`);
            const text = $(element).text().trim();
            const addresses: string[] = extractAddresses(text);
            // console.log(addresses);
            result.winningShares[currentGroup].soldAt = addresses;

            toExtract = false;
        }

        if (text.startsWith('Group') && text.includes('winning')) {
            currentGroup = extractFirstTwoWords(text);
            if (text.includes('winning')) toExtract = true;
        }
        // else if (currentGroup && $(element).is('ul')) {
        //     const soldAt = $(element).find('li').map((_, li) => $(li).text().trim()).get();
        //     const winningShare = result.winningShares.find(ws => ws.prizeGroup === currentGroup);
        //     if (winningShare) {
        //         winningShare.soldAt = soldAt;
        //     }
        // }
    });

    // Check if Group 1 has no winner
    // const group1Info = winningOutletsDiv.text();
    // if (group1Info.includes("Group 1 has no winner")) {
    //     const group1Share = result.winningShares.find(ws => ws.prizeGroup === '1');
    //     if (group1Share) {
    //         group1Share.soldAt = ["No winner"];
    //     }
    // }

    return result;
}

// Scraping function for 4D
async function scrapeFourD(): Promise<FourDResult> {
    const url = 'https://www.singaporepools.com.sg/en/product/Pages/4d_results.aspx';
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    const tablesWrap = $('.tables-wrap').first();

    const result: FourDResult = {
        drawDate: '',
        drawNumber: '',
        topPrizes: [],
    };

    result.drawDate = tablesWrap.find('.drawDate').text().trim();
    result.drawNumber = tablesWrap.find('.drawNumber').text().trim().replace('Draw No. ', '');

    tablesWrap.find('.table:first-child tbody tr').each((i, el) => {
        const columns = $(el).find('td');
        result.topPrizes.push({
            prize: $(columns[0]).text().trim(),
            number: $(columns[1]).text().trim(),
            amount: $(columns[2]).text().trim()
        });
    });

    result.startingNumber = tablesWrap.find('.table:nth-child(2) .startingNumber').text().trim();
    result.endingNumber = tablesWrap.find('.table:nth-child(2) .endingNumber').text().trim();

    //   console.log(result);
    return result;
}

// Function to save data to a JSON file
async function saveDataToFile(data: TotoResult | FourDResult, filename: string): Promise<void> {
    const folderPath = path.join(__dirname, 'data');
    await fs.mkdir(folderPath, { recursive: true });
    const filePath = path.join(folderPath, filename);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

// Main function to run the ETL process
async function runETL(): Promise<void> {
    await initializeTotoDatabase();

    try {
        const totoData = await scrapeToto();
        await saveDataToFile(totoData, `toto_${totoData.drawNo}.json`);
        await saveTotoToDatabase(totoData);


        console.log(`TOTO data saved for draw ${totoData.drawNo}`);

        // const fourDData = await scrapeFourD();
        // await saveData(fourDData, `4d_${fourDData.drawNumber}.json`);
        // console.log(`4D data saved for draw ${fourDData.drawNumber}`);
    } catch (error) {
        console.error('Error in ETL process:', error);
    }
}

// Schedule the ETL process
// cron.schedule('0 0 * * 2,5', () => {
//   console.log('Running scheduled ETL process');
//   runETL();
// });

// connectToDatabase();

// Run the ETL process immediately (for testing)
runETL();

console.log('ETL pipeline started. Waiting for scheduled runs...');
