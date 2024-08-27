import pg from 'pg';
import { createDrawTable } from './sql-queries/create/create-draw-table.js';
import { createWinningGroupTable } from './sql-queries/create/create-winning-group-table.js';
import { createAddressTable } from './sql-queries/create/create-address-table.js';
import { TotoResult } from '../../models/Toto.js';
import { convertToDollars, convertToSQLDate, extractAddressAndType } from '../helper-functions/sql-helpers.js';

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
        console.log(`Successfully connected to ${client.database}`);

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

export async function saveTotoToDatabase(totoData: TotoResult) {
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
        console.log(`Successfully connected to ${client.database}`);

        console.log(totoData);
        // const insertDrawTableQuery: string = `
        //     INSERT INTO public."Draw" (draw_no, date, group_1_prize, winning_number_1, winning_number_2, winning_number_3, winning_number_4, winning_number_5, winning_number_6, additional_number)
        //     VALUES (
        //         ${totoData.drawNo}, 
        //         '${convertToSQLDate(totoData.date)}',
        //         ${convertToDollars(totoData.group1Prize)},
        //         ${totoData.winningNumbers[0]},
        //         ${totoData.winningNumbers[1]},
        //         ${totoData.winningNumbers[2]},
        //         ${totoData.winningNumbers[3]},
        //         ${totoData.winningNumbers[4]},
        //         ${totoData.winningNumbers[5]},
        //         ${totoData.additionalNumber});
        // `;
        // await client.query(insertDrawTableQuery);
        console.log(`Draw table of draw: ${totoData.drawNo} successfully inserted`);

        for (const [groupNo, winningShare] of Object.entries(totoData.winningShares)) {
            console.log(`Inserting ${groupNo} for draw: ${totoData.drawNo}...`)
            const winningGroupId: number = parseInt(`${totoData.drawNo}${groupNo.split(' ')[1]}`);
            // const insertWinningGroupTableQuery: string = `
            //     INSERT INTO public."WinningGroup" (winning_group_id, draw_no, group_no, share_amount, no_of_winning_shares)
            //     VALUES (
            //         ${winningGroupId}, 
            //         ${totoData.drawNo},
            //         ${parseInt(groupNo.split(' ')[1])},
            //         ${convertToDollars(winningShare.shareAmount)},
            //         ${convertToDollars(winningShare.numberOfWinningShares)});
            // `;
            // console.log(insertWinningGroupTableQuery);
            // await client.query(insertWinningGroupTableQuery);

            for (const address of winningShare.soldAt) {
                const addressAndType: { address: string; type: string } = extractAddressAndType(address);
                console.log(addressAndType)
                const insertAddressTableQuery: string = `
                    INSERT INTO public."Address" (address, winning_type, winning_group_id)
                    VALUES (
                        '${addressAndType.address}', 
                        '${addressAndType.type}',
                        ${winningGroupId}
                    );`;
                console.log(insertAddressTableQuery)
                await client.query(insertAddressTableQuery);
            }
        }

        console.log(`WinningGroup table of draw: ${totoData.drawNo} successfully inserted`);
        console.log(`Address table of draw: ${totoData.drawNo} successfully inserted`);

        await client.end();
    } catch (error) {
        throw error;
    }
}

