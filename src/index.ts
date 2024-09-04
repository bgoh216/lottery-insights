import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';
import * as fs from 'fs/promises';
import * as path from 'path';
import dotenv from "dotenv";

import { __dirname } from './constants/helper.js';
import express, { Express, Request, Response } from "express";
import { FourDResult, TotoResult, WinningShare } from './models/Toto.js';
import { getData, initializeTotoDatabase, saveTotoToDatabase } from './utils/database/helper.js';
import { totoRoutes } from './controllers/toto.js';
import { readFileToString } from './utils/helper-functions/sql-helpers.js';

interface DrawInfo {
    querystring: string;
    value: string;
    date: string;
}

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
    const cleanedText: string = text.replace(/\s+/g, ' ').trim();

    // Split the text into sentences
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

// Scraping function for TOTO
async function scrapeToto(url: string): Promise<TotoResult> {
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
    });

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
        drawNo: '',
        topPrizes: [],
    };

    result.drawDate = tablesWrap.find('.drawDate').text().trim();
    result.drawNo = tablesWrap.find('.drawNumber').text().trim().replace('Draw No. ', '');

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

function isToto(obj: any): obj is TotoResult {
    return typeof obj === 'object' && obj !== null && 'drawNo' in obj && 'winningShares' in obj;
}

function is4D(obj: any): obj is FourDResult {
    return typeof obj === 'object' && obj !== null && 'drawNo' in obj && 'topPrizes' in obj;
}

// Function to save data to a JSON file
async function saveDataToFile(data: TotoResult | FourDResult, filename: string): Promise<void> {
    let folderPath = path.join(__dirname, 'data');
    if (isToto(data)) folderPath = path.join(folderPath, 'toto');
    if (is4D(data)) folderPath = path.join(folderPath, '4d');

    await fs.mkdir(folderPath, { recursive: true });
    const filePath = path.join(folderPath, filename);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

async function getDrawList(): Promise<DrawInfo[]> {
    console.log('Fetching draw list...');
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
        await page.goto('https://www.singaporepools.com.sg/en/product/sr/Pages/toto_results.aspx', { waitUntil: 'networkidle0' });

        // Wait for the dropdown to be present
        await page.waitForSelector('.form-control.selectDrawList', { timeout: 10000 });

        // Click the dropdown to populate it
        await page.click('.form-control.selectDrawList');

        // Extract the draw list
        const drawList = await page.evaluate(() => {
            const options = Array.from(document.querySelectorAll('.form-control.selectDrawList option'));
            return options.map(option => ({
                querystring: option.getAttribute('querystring') || '',
                value: option.getAttribute('value') || '',
                date: option.textContent?.trim() || ''
            }));
        });

        return drawList;
    } finally {
        await browser.close();
    }
}

// Main function to run the ETL process
async function runETL(): Promise<void> {
    const baseUrl = 'https://www.singaporepools.com.sg/en/product/sr/Pages/toto_results.aspx';
    await initializeTotoDatabase();

    const drawList = await getDrawList();
    console.log(`Found ${drawList.length} draws`);

    try {
        for (const draw of drawList) {
            const url = `${baseUrl}?${draw.querystring}`;
            console.log(`Crawling: ${url}...`);

            const totoData = await scrapeToto(url);
            await saveDataToFile(totoData, `toto_${totoData.drawNo}.json`);
            await saveTotoToDatabase(totoData);

            console.log(`TOTO data saved for draw ${totoData.drawNo}`);
        }

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

// Run the ETL process immediately (for testing)
// runETL();

console.log('ETL pipeline started. Waiting for scheduled runs...');
dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;


app.use(express.json());
app.use('/toto', totoRoutes);

app.get("/", (req: Request, res: Response) => {
    res.send("Welcome");
});

app.get("/", (req: Request, res: Response) => {
    res.send("Welcome");
});

app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});