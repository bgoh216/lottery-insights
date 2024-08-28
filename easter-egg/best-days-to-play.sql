-- Best Days to Play: Analyze which days have had the highest Group 1 prizes
SELECT 
    EXTRACT(DOW FROM d.date) as day_of_week,
    TO_CHAR(d.date, 'Day') as day_name,
    AVG(d.group_1_prize) as avg_group1_prize,
    COUNT(*) as draw_count
FROM 
    public."Draw" d
GROUP BY 
    day_of_week, day_name
ORDER BY 
    avg_group1_prize DESC;
