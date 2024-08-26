export const createAddressTable: string = `CREATE TABLE IF NOT EXISTS public."Address"
(
	address VARCHAR(1000) PRIMARY KEY UNIQUE,
	winning_type VARCHAR(100) NOT NULL,
	winning_group_id INT,

	FOREIGN KEY (winning_group_id) REFERENCES public."WinningGroup"(winning_group_id)
);
`;