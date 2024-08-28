-- Winning Store Locations (Bubble Map or Scatter Plot)
SELECT 
    a.address,
    COUNT(*) as win_count,
    AVG(wg.share_amount) as avg_prize
FROM 
    public."Address" a
JOIN 
    public."WinningGroup" wg ON a.winning_group_id = wg.winning_group_id
GROUP BY 
    a.address
HAVING 
    COUNT(*) > 1
ORDER BY 
    win_count DESC, avg_prize DESC;
