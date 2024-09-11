import { Router } from 'express';
import { getData } from '../../utils/database/helper.js';
import { readFileToString } from '../../utils/helper-functions/sql-helpers.js';
import path from 'path';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { ICompare, IGetCompareValue, MaxPriorityQueue, MinPriorityQueue } from '@datastructures-js/priority-queue';
import { FourD } from '../../models/4d.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const fourDRoutes = Router();

type DrawDetails = {
    draw_no: number,
    date: string,
    winning_type: 'first prize' | 'second prize' | 'third prize' | 'consolation' | 'starter'
}

type WinningNumberAndCount = {
    number: number;
    count: number;
}

function formatDate(dateString: string): string {
    const date = new Date(dateString);

    // Add one day
    date.setDate(date.getDate() + 1);

    // Convert to SG time (UTC+8)
    const sgTime = new Date(date.getTime() + (8 * 60 * 60 * 1000));

    const options: Intl.DateTimeFormatOptions = {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'Asia/Singapore'
    };

    return sgTime.toLocaleDateString('en-SG', options);
}

fourDRoutes.get('/', async (req, res) => {
    const data: any = await getData(FourD.getClientConfig(), await readFileToString('src/repositories/4d/get-all-draws-and-numbers.sql'));
    res.send(data.rows.map((draw: any) => ({
        draw_no: draw.draw_no,
        date: formatDate(draw.date),
        first_prize: draw.first_prize,
        second_prize: draw.second_prize,
        third_prize: draw.third_prize,
        consolation_prizes: draw.consolation_prizes.split(', '),
        starter_prizes: draw.starter_prizes.split(', ')
    })));
})

// To add: Add more details on the count, which draw and which date, first prize, or consolation?
fourDRoutes.get('/highest-winnning-number', async (req, res) => {
    const data: any = await getData(FourD.getClientConfig(), await readFileToString('src/repositories/4d/get-all-draws-and-numbers.sql'));
    const drawDetails: DrawDetails[][] = Array(10000).fill(null).map(() => []);

    let k: number = 10;
    if (req.query.k) {
        k = parseInt(req.query.k as string);
        // Check if the parsing was successful
        if (isNaN(k)) {
            return res.status(400).send(`Invalid numeric parameters 'k'`);
        }
    }

    for (const row of data.rows) {
        const drawDetail: DrawDetails = {
            draw_no: row.draw_no,
            date: formatDate(row.date),
            winning_type: 'first prize'
        }

        drawDetails[parseInt(row.first_prize)].push({
            ...drawDetail,
            winning_type: 'first prize'
        });

        drawDetails[parseInt(row.second_prize)].push({
            ...drawDetail,
            winning_type: 'second prize'
        });

        drawDetails[parseInt(row.third_prize)].push({
            ...drawDetail,
            winning_type: 'third prize'
        });

        for (const prize of row.consolation_prizes.split(', ')) {
            drawDetails[parseInt(prize)].push({
                ...drawDetail,
                winning_type: 'consolation'
            });
        }

        for (const prize of row.starter_prizes.split(', ')) {
            drawDetails[parseInt(prize)].push({
                ...drawDetail,
                winning_type: 'starter'
            });
        }
    }

    // Create min priority queue
    const getBidValue: IGetCompareValue<WinningNumberAndCount> = (bid) => bid.count;
    const pq = new MinPriorityQueue<WinningNumberAndCount>(getBidValue);

    // Iterate through the array
    for (let i = 0; i < drawDetails.length; i++) {
        if (drawDetails[i].length > 0) {
            pq.enqueue({ number: i, count: drawDetails[i].length });
            if (pq.size() > k) {
                pq.dequeue();
            }
        }
    }

    // Extract the top K elements
    const result: { number: number; count: number; draw_details: DrawDetails[] }[] = [];
    while (!pq.isEmpty()) {
        const winningNumberAndCount = pq.dequeue();
        result.push({
            number: winningNumberAndCount.number,
            count: winningNumberAndCount.count,
            draw_details: drawDetails[winningNumberAndCount.number]
        });
    }

    res.send(result);
});

// To add: Add more details on the count, which draw and which date, first prize, or consolation?
fourDRoutes.get('/winning-number-frequency', async (req, res) => {
    const data: any = await getData(FourD.getClientConfig(), await readFileToString('src/repositories/4d/get-all-draws-and-numbers.sql'));
    const frequency: number[] = Array(10000).fill(0);

    if (!req.query.number) return res.status(400).send(`Missing 'number' numeric parameter`);
    let number: number = parseInt(req.query.number as string);

    // Checnumber if the parsing was successful
    if (isNaN(number)) {
        return res.status(400).send(`Invalid numeric parameters 'number'`);
    }

    for (const row of data.rows) {
        frequency[parseInt(row.first_prize)] += 1;
        frequency[parseInt(row.second_prize)] += 1;
        frequency[parseInt(row.third_prize)] += 1;

        for (const prize of row.consolation_prizes.split(', ')) {
            frequency[parseInt(prize)] += 1;
        }

        for (const prize of row.starter_prizes.split(', ')) {
            frequency[parseInt(prize)] += 1;
        }
    }

    res.send({
        number: req.query.number,
        count: frequency[number]
    });
});