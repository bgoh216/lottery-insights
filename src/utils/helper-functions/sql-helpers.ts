export function convertToSQLDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0];
}

export function convertToDollars(moneyStr: string): number {
    return parseInt(moneyStr.replace(/[^0-9]/g, ''), 10);
}

export function extractAddressAndType(str: string): { address: string; type: string } {
    const match = str.match(/(.*)\(([^()]+)\)[^()]*$/);
    return {
        address: match?.[1].replace(/[\s-]+$/, '').trim() ?? str,
        type: match?.[2].trim() ?? ''
    };
}