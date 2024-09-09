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

fourDRoutes.get('/highest-winnning-number', async (req, res) => {
    const data: any = await getData(FourD.getClientConfig(), await readFileToString('src/repositories/4d/get-all-draws-and-numbers.sql'));
    const frequency: number[] = Array(10000).fill(0);
    const k: number = 10;

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

    // Create a min priority queue
    interface ICar {
        index: number;
        count: number;
    }

    const getBidValue: IGetCompareValue<ICar> = (bid) => bid.count;
    const pq = new MinPriorityQueue<ICar>(getBidValue);

    // Iterate through the array
    for (let i = 0; i < frequency.length; i++) {
        if (frequency[i] > 0) {
            pq.enqueue({ index: i, count: frequency[i] });
            if (pq.size() > k) {
                pq.dequeue();
            }
        }
    }

    // Extract the top K elements
    const result: { index: number; count: number; }[] = [];
    while (!pq.isEmpty()) {
        result.unshift(pq.dequeue());
    }

    res.send(result);
});

interface FrequencyMap {
    [key: string]: number;
}

function mapToJson(map: Map<string, number>): string {
    const obj: FrequencyMap = {};
    for (const [key, value] of map.entries()) {
        obj[key] = value;
    }
    return JSON.stringify(obj, null, 2);
}