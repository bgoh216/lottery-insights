-- Correlation between Additional Number and Prize (Scatter Plot)
SELECT 
    d.additional_number,
    wg.share_amount
FROM 
    public."Draw" d
JOIN 
    public."WinningGroup" wg ON d.draw_no = wg.draw_no
WHERE 
    wg.group_no = 1
ORDER BY 
    d.date DESC
LIMIT 100;
