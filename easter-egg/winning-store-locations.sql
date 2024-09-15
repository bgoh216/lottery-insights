-- Lucky Stores: Top 5 addresses with most winning tickets
SELECT 
    a.address,
    COUNT(*) as winning_tickets_sold,
    SUM(wg.share_amount) as total_prize_money
FROM 
    public."Address" a
JOIN 
    public."WinningGroup" wg ON a.winning_group_id = wg.winning_group_id
GROUP BY 
    a.address
ORDER BY 
    winning_tickets_sold DESC, total_prize_money DESC
