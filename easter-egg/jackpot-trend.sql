-- Jackpot Trend: Analyze how the Group 1 prize has changed over time
SELECT 
    date,
    group_1_prize,
    AVG(group_1_prize) OVER (ORDER BY date ROWS BETWEEN 5 PRECEDING AND 5 FOLLOWING) as moving_avg_prize
FROM 
    public."Draw"
ORDER BY 
    date DESC
LIMIT 20;
