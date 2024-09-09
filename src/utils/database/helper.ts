import pg, { ClientConfig } from 'pg';
import { v4 as uuidv4 } from 'uuid';

import { createDrawTable } from './sql-queries/create/create-draw-table.js';
import { createWinningGroupTable } from './sql-queries/create/create-winning-group-table.js';
import { createAddressTable } from './sql-queries/create/create-address-table.js';
import { TotoResult } from '../../models/Toto.js';
import { convertToDollars, convertToSQLDate, escapeSingleQuotes, extractAddressAndType } from '../helper-functions/sql-helpers.js';
import { FourDResult } from '../../models/4d.js';
import { create4dDrawTable } from './sql-queries/create/create-4d-draw-table.js';
import { create4dConsolationTable } from './sql-queries/create/create-4d-consolation-table.js';
import { create4dStarterTable } from './sql-queries/create/create-4d-starter-table.js';

export async function initializeTotoDatabase() {
    try {
        const { Client } = pg;
        const client = new Client({
            user: 'postgres',
            password: 'password',
            host: 'localhost',
            port: 5432,
            database: 'Toto',
        });
        await client.connect();
        console.log(`Successfully connected to ${client.database} database`);

        await client.query(createDrawTable);
        console.log(`Successfully created 'Draw' table`);
        await client.query(createWinningGroupTable);
        console.log(`Successfully created 'WinningGroup' table`);
        await client.query(createAddressTable);
        console.log(`Successfully created 'Address' table`);

        await client.end();
    } catch (error) {
        throw error;
    }
}

export async function initialize4dDatabase() {
    try {
        const { Client } = pg;
        const client = new Client({
            user: 'postgres',
            password: 'password',
            host: 'localhost',
            port: 5432,
            database: '4D',
        });
        await client.connect();
        console.log(`Successfully connected to ${client.database} database`);

        await client.query(create4dDrawTable);
        console.log(`Successfully created '4D Draw' table`);
        await client.query(create4dConsolationTable);
        console.log(`Successfully created 'Consolation prizes' table`);
        await client.query(create4dStarterTable);
        console.log(`Successfully created 'Starter prizes' table`);

        await client.end();
    } catch (error) {
        throw error;
    }
}

export async function saveTotoToDatabase(totoData: TotoResult): Promise<void> {
    const { Client } = pg;
    const client = new Client({
        user: 'postgres',
        password: 'password',
        host: 'localhost',
        port: 5432,
        database: 'Toto',
    });
    await client.connect();
    console.log(`Successfully connected to ${client.database} database.`);

    try {
        const insertDrawTableQuery: string = `
            INSERT INTO public."Draw" (draw_no, date, group_1_prize, winning_number_1, winning_number_2, winning_number_3, winning_number_4, winning_number_5, winning_number_6, additional_number)
            VALUES (
                ${totoData.drawNo}, 
                '${convertToSQLDate(totoData.date)}',
                ${convertToDollars(totoData.group1Prize)},
                ${totoData.winningNumbers[0]},
                ${totoData.winningNumbers[1]},
                ${totoData.winningNumbers[2]},
                ${totoData.winningNumbers[3]},
                ${totoData.winningNumbers[4]},
                ${totoData.winningNumbers[5]},
                ${totoData.additionalNumber});
        `;
        await client.query(insertDrawTableQuery);
        console.log(`Draw table of draw: ${totoData.drawNo} successfully inserted`);

        for (const [groupNo, winningShare] of Object.entries(totoData.winningShares)) {
            console.log(`Inserting ${groupNo} for draw: ${totoData.drawNo}...`)
            const winningGroupId: number = parseInt(`${totoData.drawNo}${groupNo.split(' ')[1]}`);
            const insertWinningGroupTableQuery: string = `
                INSERT INTO public."WinningGroup" (winning_group_id, draw_no, group_no, share_amount, no_of_winning_shares)
                VALUES (
                    ${winningGroupId}, 
                    ${totoData.drawNo},
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
            console.info(`Draw number ${totoData.drawNo} have been inserted. Skipping...`);
            return;
        }
        console.log(error.error);
        throw error;
    } finally {
        await client.end();
    }
}


export async function save4dToDatabase(result: FourDResult): Promise<void> {
    const { Client } = pg;
    const client = new Client({
        user: 'postgres',
        password: 'password',
        host: 'localhost',
        port: 5432,
        database: '4D',
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



export async function getData(clientConfig: ClientConfig, sqlQuery: string): Promise<any> {
    const { Client } = pg;
    const client = new Client(clientConfig);
    await client.connect();
    console.log(`Successfully connected to ${client.database} database.`);

    try {
        const result = await client.query(sqlQuery);
        console.log(`Successfully retrieved data.`);
        return result;
    } catch (error) {
        throw new Error('Error fetching query');
    }
}

