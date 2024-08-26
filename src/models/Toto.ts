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
    date: string;
    drawNo: string;
    winningNumbers: string[];
    additionalNumber: string;
    group1Prize: string;
    winningShares: { [groupNumber: string]: WinningShare };
}

export interface FourDResult {
    drawDate: string;
    drawNumber: string;
    topPrizes: {
        prize: string;
        number: string;
        amount: string;
    }[];
    startingNumber?: string;
    endingNumber?: string;
}