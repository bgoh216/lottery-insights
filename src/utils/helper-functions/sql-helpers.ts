import * as fs from 'fs/promises';
import * as path from 'path';
import { TotoResult } from '../../models/Toto.js';
import { FourDResult } from '../../models/4d.js';

export function convertToSQLDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0];
}

export function convertToDollars(moneyStr: string): number {
    if (moneyStr === '-') return 0;
    return parseInt(moneyStr.replace(/[^0-9]/g, ''), 10);
}

export function extractAddressAndType(str: string): { address: string; type: string } {
    const match = str.match(/(.*)\(([^()]+)\)[^()]*$/);
    return {
        address: match?.[1].replace(/[\s-]+$/, '').trim() ?? str,
        type: match?.[2].trim() ?? ''
    };
}

export function escapeSingleQuotes(str: string): string {
    return str.replace(/'/g, "''");
}

export async function readFileToString(filePath: string): Promise<string> {
    try {
        const resolvedPath = path.resolve(filePath);
        const fileContents = await fs.readFile(resolvedPath, 'utf8');
        return fileContents;
    } catch (error) {
        console.error(`Error reading file: ${error}`);
        return '';
    }
}

export function isToto(obj: any): obj is TotoResult {
    return typeof obj === 'object' && obj !== null && 'drawNo' in obj && 'winningShares' in obj;
}

export function is4D(obj: any): obj is FourDResult {
    return typeof obj === 'object' && obj !== null && 'drawNo' in obj && 'consolationNumbers' in obj;
}

// Function to save data to a JSON file
export async function saveDataToFile(data: TotoResult | FourDResult, filename: string): Promise<void> {
    let folderPath = path.join(__dirname, 'data');
    if (isToto(data)) folderPath = path.join(folderPath, 'toto');
    if (is4D(data)) folderPath = path.join(folderPath, '4d');

    await fs.mkdir(folderPath, { recursive: true });
    const filePath = path.join(folderPath, filename);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}