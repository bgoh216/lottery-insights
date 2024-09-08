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