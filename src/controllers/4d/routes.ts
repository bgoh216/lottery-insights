import { Router } from 'express';
import { getData } from '../../utils/database/helper.js';
import { readFileToString } from '../../utils/helper-functions/sql-helpers.js';
import path from 'path';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const fourDRoutes = Router();

fourDRoutes.get('/highest-winnning-number', async (req, res) => {
    const data: any = await getData(await readFileToString('src/repositories/latest-draw.sql'));

    const htmlContent = ``;

    res.send(htmlContent);
});