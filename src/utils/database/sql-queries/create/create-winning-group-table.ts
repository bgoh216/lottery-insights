export const createWinningGroupTable: string = `CREATE TABLE IF NOT EXISTS public."WinningGroup"
(
	winning_group_id INT PRIMARY KEY UNIQUE,
	draw_no INT NOT NULL,
	group_no INT CHECK (group_no BETWEEN 1 AND 7),
	share_amount INT,
	no_of_winning_shares INT,

	FOREIGN KEY (draw_no) REFERENCES public."Draw"(draw_no)
);
`;