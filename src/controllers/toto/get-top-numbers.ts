import { Router } from 'express';
import { getData } from '../../utils/database/helper.js';
import { readFileToString } from '../../utils/helper-functions/sql-helpers.js';
import path from 'path';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { Toto } from '../../models/Toto.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const totoRoutes = Router();

totoRoutes.get('/top-numbers', async (req, res) => {
  const data: any = await getData(Toto.getClientConfig(), await readFileToString('easter-egg/winning-number-distribution.sql'));
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Number Frequency Table</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
            }
            h1 {
                text-align: center;
                color: #2c3e50;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
            }
            th, td {
                padding: 12px;
                text-align: left;
                border-bottom: 1px solid #ddd;
            }
            th {
                background-color: #f2f2f2;
                font-weight: bold;
                color: #2c3e50;
                cursor: pointer;
            }
            th:hover {
                background-color: #e8e8e8;
            }
            tr:nth-child(even) {
                background-color: #f8f8f8;
            }
            tr:hover {
                background-color: #e8e8e8;
            }
        </style>
    </head>
    <body>
        <h1>Number Frequency Table</h1>
        <table id="frequencyTable">
            <thead>
                <tr>
                    <th onclick="sortTable(0)">Number</th>
                    <th onclick="sortTable(1)">Frequency</th>
                </tr>
            </thead>
            <tbody>
                ${data.rows.map((item: any) => `
                    <tr>
                        <td>${item.number}</td>
                        <td>${item.frequency}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <script>
        function sortTable(n) {
          var table, rows, switching, i, x, y, shouldSwitch, dir, switchcount = 0;
          table = document.getElementById("frequencyTable");
          switching = true;
          dir = "asc";
          while (switching) {
            switching = false;
            rows = table.rows;
            for (i = 1; i < (rows.length - 1); i++) {
              shouldSwitch = false;
              x = rows[i].getElementsByTagName("TD")[n];
              y = rows[i + 1].getElementsByTagName("TD")[n];
              if (dir == "asc") {
                if (n === 0) {
                  if (Number(x.innerHTML) > Number(y.innerHTML)) {
                    shouldSwitch = true;
                    break;
                  }
                } else {
                  if (Number(x.innerHTML) > Number(y.innerHTML)) {
                    shouldSwitch = true;
                    break;
                  }
                }
              } else if (dir == "desc") {
                if (n === 0) {
                  if (Number(x.innerHTML) < Number(y.innerHTML)) {
                    shouldSwitch = true;
                    break;
                  }
                } else {
                  if (Number(x.innerHTML) < Number(y.innerHTML)) {
                    shouldSwitch = true;
                    break;
                  }
                }
              }
            }
            if (shouldSwitch) {
              rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
              switching = true;
              switchcount ++;
            } else {
              if (switchcount == 0 && dir == "asc") {
                dir = "desc";
                switching = true;
              }
            }
          }
        }
        </script>
    </body>
    </html>
  `;

  res.send(htmlContent);
});

totoRoutes.get('/top-address', async (req, res) => {
  const data: any = await getData(Toto.getClientConfig(), await readFileToString('easter-egg/winning-store-locations.sql'));

  try {
    // Read the HTML template
    const htmlTemplate = await readFileToString('src/templates/lottery-results-template.html')

    // Assume you have your data in a variable called 'data'
    const dataRows: any = data.rows;

    // Convert data to a JSON string
    const dataString = JSON.stringify(dataRows);

    // Replace the placeholder in the HTML with the actual data
    const htmlWithData = htmlTemplate.replace('DATA_PLACEHOLDER', dataString);

    // Send the HTML response
    res.send(htmlWithData);
  } catch (error) {
    console.error('Error rendering lottery results:', error);
    res.status(500).send('An error occurred while rendering the lottery results.');
  }
});