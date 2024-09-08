export const create4dConsolationTable: string = `CREATE TABLE IF NOT EXISTS public."4D_Consolation"
(
	consolation_prize_id UUID PRIMARY KEY,
	draw_no INT,
	prize CHAR(4),

	FOREIGN KEY (draw_no) REFERENCES public."4D_Draw"(draw_no)
)`;