-- Seasonal Jackpot Trend (Heat Map or Multi-line Chart)
SELECT 
    EXTRACT(YEAR FROM date) as year,
    EXTRACT(MONTH FROM date) as month,
    AVG(group_1_prize) as avg_jackpot
FROM 
    public."Draw"
GROUP BY 
    year, month
ORDER BY 
    year, month;
