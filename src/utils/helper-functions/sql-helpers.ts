import * as fs from 'fs/promises';
import * as path from 'path';

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