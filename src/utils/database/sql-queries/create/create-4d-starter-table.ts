export const create4dStarterTable: string = `CREATE TABLE IF NOT EXISTS public."4D_Starter"
(
	starter_prize_id UUID PRIMARY KEY,
	draw_no INT,
	prize CHAR(4),

	FOREIGN KEY (draw_no) REFERENCES public."4D_Draw"(draw_no)
)`;