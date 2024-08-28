-- Additional Number Impact: Check if having the additional number correct increases winnings
SELECT 
    CASE 
        WHEN wg.group_no = 2 OR wg.group_no = 5 THEN 'With Additional'
        ELSE 'Without Additional'
    END AS additional_number_status,
    AVG(wg.share_amount) as avg_win_amount,
    COUNT(*) as win_count
FROM 
    public."WinningGroup" wg
GROUP BY 
    additional_number_status
ORDER BY 
    avg_win_amount DESC;
