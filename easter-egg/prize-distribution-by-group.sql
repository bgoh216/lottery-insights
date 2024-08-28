-- Prize Distribution by Group (Pie Chart or Treemap)
SELECT 
    group_no,
    AVG(share_amount) as avg_prize,
    COUNT(*) as winner_count
FROM 
    public."WinningGroup"
GROUP BY 
    group_no
ORDER BY 
    group_no;
