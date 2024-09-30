import { __dirname } from './constants/helper.js';
import express, { Express, Request, Response } from "express";
import { Toto, TotoResult, WinningShare } from './models/Toto.js';
import { getData, initialize4dDatabase, initializeTotoDatabase, save4dToDatabase, saveTotoToDatabase } from './utils/database/helper.js';
import { totoRoutes } from './controllers/toto/get-top-numbers.js';
import { readFileToString, saveDataToFile } from './utils/helper-functions/sql-helpers.js';
import { FourD, FourDResult } from './models/4d.js';
import { DrawInfo } from './constants/types/drawInfo.js';
import { fourDRoutes } from './controllers/4d/routes.js';

// Main function to run the ETL process
async function runETL(): Promise<void> {

    await initializeTotoDatabase();
    await initialize4dDatabase();

    try {
        const drawInfos: DrawInfo[] = await instanceToto.getAllDrawList();
        console.log(`Found ${drawInfos.length} draws`);

        for (const draw of drawInfos) {
            const url = `${Toto.BASE_URL}?${draw.querystring}`;
            console.log(`Crawling: ${url}...`);

            const data = await instanceToto.scrapeData(url);


            await saveDataToFile(data, `toto_${data.drawNo}.json`);
            await instanceToto.saveResultsToDatabase(data);

            console.log(`Data saved for draw ${data.drawNo}`);
        }
    } catch (error) {
        console.error('Error in ETL process:', error);
    }

    // await fs.writeFile('allpaths', JSON.stringify(all4dDraws, null, 2));
    try {
        const drawInfos: DrawInfo[] = await instance4D.getAllDrawList();
        console.log(`Found ${drawInfos.length} draws`);

        for (const draw of drawInfos) {
            const url = `${FourD.BASE_URL}?${draw.querystring}`;
            console.log(`Crawling: ${url}...`);

            const data = await instance4D.scrapeData(url);


            await saveDataToFile(data, `4d_${data.drawNo}.json`);
            await instance4D.saveResultsToDatabase(data);

            console.log(`Data saved for draw ${data.drawNo}`);
        }
    } catch (error) {
        console.error('Error in ETL process:', error);
    }
}

// Schedule the ETL process
// cron.schedule('0 0 * * 2,5', () => {
//   console.log('Running scheduled ETL process');
//   runETL();
// });

const instance4D = FourD.instance;
const instanceToto = Toto.instance;

// Run the ETL process immediately (for testing)
runETL();

// console.log('ETL pipeline started. Waiting for scheduled runs...');
// dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use('/toto', totoRoutes);
app.use('/4d', fourDRoutes);

app.get("/health", (req: Request, res: Response) => {
    res.send("health check successful");
});

app.get("/", (req: Request, res: Response) => {
    res.send("Welcome");
});

app.listen(port, () => {
    console.log(`[server]: Server is running at http://database-1.cziks8mcgmt1.ap-southeast-1.rds.amazonaws.com:${port}`);
});