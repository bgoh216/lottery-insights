-- Winning Type Analysis: Show which type of entry has the highest win rate
SELECT 
    a.winning_type,
    COUNT(*) as total_wins,
    AVG(wg.share_amount) as avg_win_amount,
    MAX(wg.share_amount) as max_win_amount
FROM 
    public."Address" a
JOIN 
    public."WinningGroup" wg ON a.winning_group_id = wg.winning_group_id
GROUP BY 
    a.winning_type
ORDER BY 
    total_wins DESC, avg_win_amount DESC;
