export const create4dDrawTable: string = `CREATE TABLE IF NOT EXISTS public."4D_Draw"
(
	draw_no INT PRIMARY KEY,
	date DATE NOT NULL,
	first_prize CHAR(4),
	second_prize CHAR(4),
    third_prize CHAR(4)
)`;