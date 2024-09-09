import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';
import * as fs from 'fs/promises';
import * as path from 'path';
import dotenv from "dotenv";
import pg, { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { DrawInfo } from '../constants/types/drawInfo.js';
import { convertToDollars, convertToSQLDate, escapeSingleQuotes, extractAddressAndType } from '../utils/helper-functions/sql-helpers.js';

export type WinningShare = {
    shareAmount: string;
    numberOfWinningShares: string;
    soldAt: string[];
}

export type WinningShares = {
    'Group 1': WinningShare,
    'Group 2': WinningShare,
    'Group 3': WinningShare,
    'Group 4': WinningShare,
    'Group 5': WinningShare,
    'Group 6': WinningShare,
    'Group 7': WinningShare,
}

export interface TotoResult {
    drawNo: string;
    date: string;
    winningNumbers: string[];
    additionalNumber: string;
    group1Prize: string;
    winningShares: { [groupNumber: string]: WinningShare };
}
// iTOTO / 28 is the amount
// https://online.singaporepools.com/en/lottery/comparison-between-toto-itoto

export class Toto {
    static #instance: Toto;
    static latestDrawDate: Date;
    readonly BASE_URL: string = 'https://www.singaporepools.com.sg/en/product/sr/Pages/toto_results.aspx';
    readonly DATABASE: string = 'Toto';
    pool: Pool;

    constructor() {
        this.pool = new Pool({
            user: 'postgres',
            host: 'localhost',
            database: this.DATABASE,
            password: 'password',
            port: 5432,
            max: 20, // maximum number of connections in the pool
            idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
            connectionTimeoutMillis: 2000, // how long to wait for a connection to be established
        });
    }

    public static get instance(): Toto {
        if (!Toto.#instance) {
            Toto.#instance = new Toto();
        }

        return Toto.#instance;
    }

    // Scraping function for 4D
    public async scrapeData(url: string): Promise<TotoResult> {
        try {
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
                    const addresses: string[] = this.extractAddresses(text);
                    // console.log(addresses);
                    result.winningShares[currentGroup].soldAt = addresses;

                    toExtract = false;
                }

                if (text.startsWith('Group') && text.includes('winning')) {
                    currentGroup = this.extractFirstTwoWords(text);
                    if (text.includes('winning')) toExtract = true;
                }
            });

            console.log(`Successfully scrape toto data: ${result.drawNo}`);
            return result;
        } catch (error) {
            throw new Error(`Failed to scrape Toto data.`);
        }
    }

    public async getAllDrawList(): Promise<DrawInfo[]> {
        console.log('Fetching Toto draw list...');
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();

        try {
            await page.goto(this.BASE_URL, { waitUntil: 'networkidle0' });

            // Wait for the dropdown to be present
            await page.waitForSelector('.form-control.selectDrawList', { timeout: 10000 });

            // Click the dropdown to populate it
            await page.click('.form-control.selectDrawList');

            // Extract the draw list
            const drawList = await page.evaluate(() => {
                const selectElement = document.querySelector('.form-control.selectDrawList');
                if (!selectElement) return [];

                const options = Array.from(selectElement.querySelectorAll('option'));
                return options.map(option => ({
                    querystring: option.getAttribute('querystring') || '',
                    value: option.getAttribute('value') || '',
                    date: option.textContent?.trim() || ''
                }));
            });

            return drawList;
        } catch (error) {
            throw new Error(`Failed to get all 4D draw list.`);
        } finally {
            await browser.close();
        }
    }

    public async saveResultsToDatabase(result: TotoResult): Promise<void> {
        const { Client } = pg;
        const client = new Client({
            user: 'postgres',
            password: 'password',
            host: 'localhost',
            port: 5432,
            database: this.DATABASE,
        });
        await client.connect();
        console.log(`Successfully connected to ${client.database} database.`);

        try {
            const insertDrawTableQuery: string = `
            INSERT INTO public."Draw" (draw_no, date, group_1_prize, winning_number_1, winning_number_2, winning_number_3, winning_number_4, winning_number_5, winning_number_6, additional_number)
            VALUES (
                ${result.drawNo}, 
                '${convertToSQLDate(result.date)}',
                ${convertToDollars(result.group1Prize)},
                ${result.winningNumbers[0]},
                ${result.winningNumbers[1]},
                ${result.winningNumbers[2]},
                ${result.winningNumbers[3]},
                ${result.winningNumbers[4]},
                ${result.winningNumbers[5]},
                ${result.additionalNumber});
        `;
            await client.query(insertDrawTableQuery);
            console.log(`Draw table of draw: ${result.drawNo} successfully inserted`);

            for (const [groupNo, winningShare] of Object.entries(result.winningShares)) {
                console.log(`Inserting ${groupNo} for draw: ${result.drawNo}...`)
                const winningGroupId: number = parseInt(`${result.drawNo}${groupNo.split(' ')[1]}`);
                const insertWinningGroupTableQuery: string = `
                INSERT INTO public."WinningGroup" (winning_group_id, draw_no, group_no, share_amount, no_of_winning_shares)
                VALUES (
                    ${winningGroupId}, 
                    ${result.drawNo},
                    ${parseInt(groupNo.split(' ')[1])},
                    ${convertToDollars(winningShare.shareAmount)},
                    ${convertToDollars(winningShare.numberOfWinningShares)});
            `;
                // console.log(insertWinningGroupTableQuery);
                await client.query(insertWinningGroupTableQuery);
                console.log(`${groupNo} successfully inserted.`);

                for (const address of winningShare.soldAt) {
                    const addressAndType: { address: string; type: string } = extractAddressAndType(address);
                    const insertAddressTableQuery: string = `
                    INSERT INTO public."Address" (address_id, address, winning_type, winning_group_id)
                    VALUES (
                        '${uuidv4()}',
                        '${escapeSingleQuotes(addressAndType.address)}', 
                        '${addressAndType.type}',
                        ${winningGroupId}
                    );`;
                    // console.log(insertAddressTableQuery);
                    await client.query(insertAddressTableQuery);
                }
                console.log(`Address successfully inserted`);
            }

        } catch (error: any) {
            if (error.code == '23505') {
                console.info(`Draw number ${result.drawNo} have been inserted. Skipping...`);
                return;
            }
            console.log(error.error);
            throw error;
        } finally {
            await client.end();
        }
    }

    private extractAddresses(text: string): string[] {
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
                if (sentence.startsWith('iTOTO - System')) this.processITOTOString(sentence, processedSentences);
                else processedSentences.push(sentence);
            }
        }

        return processedSentences;
    }

    private processITOTOString(input: string, processedSentences: string[]) {
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

    private extractFirstTwoWords(text: string): string {
        // Remove leading and trailing whitespace
        const trimmedText = text.trim();

        // Split the text into words
        const words = trimmedText.split(/\s+/);

        // Return the first two words, or the whole string if less than two words
        return words.slice(0, 2).join(' ');
    }

}