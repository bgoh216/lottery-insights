import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';
import * as fs from 'fs/promises';
import * as path from 'path';
import dotenv from "dotenv";
import pg from 'pg';
import { v4 as uuidv4 } from 'uuid';

import { DrawInfo } from '../constants/types/drawInfo.js';
import { convertToSQLDate } from '../utils/helper-functions/sql-helpers.js';

export type FourDResult = {
    drawNo: string;
    date: string;
    firstNumber: string;
    secondNumber: string;
    thirdNumber: string;
    consolationNumbers: string[];
    starterNumbers: string[];
}

export class FourD {
    static #instance: FourD;
    static latestDrawDate: Date;
    static readonly BASE_URL: string = 'https://www.singaporepools.com.sg/en/product/Pages/4d_results.aspx';
    static readonly DATABASE: string = '4D';

    public static get instance(): FourD {
        if (!FourD.#instance) {
            FourD.#instance = new FourD();
        }

        return FourD.#instance;
    }

    // Scraping function for 4D
    public async scrapeData(url: string): Promise<FourDResult> {
        try {
            const response = await axios.get(url);
            const $ = cheerio.load(response.data);

            const fourDResult: FourDResult = {
                drawNo: '',
                date: '',
                firstNumber: '',
                secondNumber: '',
                thirdNumber: '',
                consolationNumbers: [],
                starterNumbers: []
            };

            // Extract draw number and date
            const drawInfo = $('.drawNumber').text().trim();
            fourDResult.drawNo = drawInfo.split('Draw No. ')[1];

            const dateInfo = $('.drawDate').text().trim();
            fourDResult.date = dateInfo;

            // Extract winning numbers
            fourDResult.firstNumber = $('.tdFirstPrize').text().trim();
            fourDResult.secondNumber = $('.tdSecondPrize').text().trim();
            fourDResult.thirdNumber = $('.tdThirdPrize').text().trim();

            // Extract starter numbers
            $('.tbodyStarterPrizes td').each((i, elem) => {
                fourDResult.starterNumbers.push($(elem).text().trim());
            });

            // Extract consolation numbers
            $('.tbodyConsolationPrizes td').each((i, elem) => {
                fourDResult.consolationNumbers.push($(elem).text().trim());
            });

            console.log(`Successfully scrape 4d data: ${fourDResult.drawNo}`);
            return fourDResult;
        } catch (error) {
            throw new Error(`Failed to scrape 4D data.`);
        }

    }

    public static getClientConfig() {
        return {
            user: 'postgres',
            password: 'password',
            host: 'localhost',
            port: 5432,
            database: this.DATABASE,
        };
    }

    public async getAllDrawList(): Promise<DrawInfo[]> {
        console.log('Fetching 4D draw list...');
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();

        try {
            await page.goto(FourD.BASE_URL, { waitUntil: 'networkidle0' });

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

    public async saveResultsToDatabase(result: FourDResult): Promise<void> {
        const { Client } = pg;
        const client = new Client({
            user: 'postgres',
            password: 'password',
            host: 'localhost',
            port: 5432,
            database: FourD.DATABASE,
        });
        await client.connect();
        console.log(`Successfully connected to ${client.database} database.`);

        try {
            const insert4DDrawTableQuery: string = `
                INSERT INTO public."4D_Draw" (draw_no, date, first_prize, second_prize, third_prize)
                VALUES (
                    ${result.drawNo}, 
                    '${convertToSQLDate(result.date)}',
                    '${result.firstNumber}',
                    '${result.secondNumber}',
                    '${result.thirdNumber}');
            `;
            await client.query(insert4DDrawTableQuery);
            console.log(`4D Draw table of draw: ${result.drawNo} successfully inserted`);

            console.log(`Inserting starter prizes for draw: ${result.drawNo}...`)
            for (const number of result.starterNumbers) {
                try {
                    const insertStarterNumbersQuery: string = `
                        INSERT INTO public."4D_Starter" (starter_prize_id , draw_no, prize)
                        VALUES (
                            '${uuidv4()}',
                            ${result.drawNo},
                            '${number}');
                    `;

                    await client.query(insertStarterNumbersQuery);
                } catch (error) {
                    console.error(`Error inserting consolation number ${number}:`, error);
                    // Handle the error as needed (e.g., log it, skip to next iteration, etc.)
                }
            }

            console.log(`Inserting consolation prizes for draw: ${result.drawNo}...`)
            for (const number of result.consolationNumbers) {
                try {
                    const insertConsolationNumbersQuery: string = `
                        INSERT INTO public."4D_Consolation" (consolation_prize_id, draw_no, prize)
                        VALUES (
                            '${uuidv4()}',
                            ${result.drawNo},
                            '${number}');
                    `;

                    await client.query(insertConsolationNumbersQuery);
                } catch (error) {
                    console.error(`Error inserting consolation number ${number}:`, error);
                    // Handle the error as needed (e.g., log it, skip to next iteration, etc.)
                }
            }

            console.log(`Prizes successfully inserted`);
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
}