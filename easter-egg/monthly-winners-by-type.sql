-- Monthly Winners by Type (Stacked Bar Chart or Area Chart)
SELECT 
    DATE_TRUNC('month', d.date) as month,
    a.winning_type,
    COUNT(*) as winner_count
FROM 
    public."Address" a
JOIN 
    public."WinningGroup" wg ON a.winning_group_id = wg.winning_group_id
JOIN 
    public."Draw" d ON wg.draw_no = d.draw_no
GROUP BY 
    month, a.winning_type
ORDER BY 
    month, a.winning_type;
