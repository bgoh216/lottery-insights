export const createDrawTable: string = `CREATE TABLE IF NOT EXISTS public."Draw"
(
	draw_no INT PRIMARY KEY,
	date DATE NOT NULL,
	group_1_prize INT,
	winning_number_1 INT CHECK (winning_number_1 BETWEEN 1 AND 49),
	winning_number_2 INT CHECK (winning_number_2 BETWEEN 1 AND 49),
	winning_number_3 INT CHECK (winning_number_3 BETWEEN 1 AND 49),
	winning_number_4 INT CHECK (winning_number_4 BETWEEN 1 AND 49),
	winning_number_5 INT CHECK (winning_number_5 BETWEEN 1 AND 49),
	winning_number_6 INT CHECK (winning_number_6 BETWEEN 1 AND 49),
	additional_number INT CHECK (additional_number BETWEEN 1 AND 49)
)`;