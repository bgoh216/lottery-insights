-- Consecutive Number Analysis: Check how often consecutive numbers appear
WITH consecutive_counts AS (
    SELECT 
        draw_no,
        (CASE WHEN winning_number_2 = winning_number_1 + 1 THEN 1 ELSE 0 END +
         CASE WHEN winning_number_3 = winning_number_2 + 1 THEN 1 ELSE 0 END +
         CASE WHEN winning_number_4 = winning_number_3 + 1 THEN 1 ELSE 0 END +
         CASE WHEN winning_number_5 = winning_number_4 + 1 THEN 1 ELSE 0 END +
         CASE WHEN winning_number_6 = winning_number_5 + 1 THEN 1 ELSE 0 END) as consecutive_count
    FROM 
        public."Draw"
)
SELECT 
    consecutive_count,
    COUNT(*) as occurrence,
    COUNT(*) * 100.0 / (SELECT COUNT(*) FROM public."Draw") as percentage
FROM 
    consecutive_counts
GROUP BY 
    consecutive_count
ORDER BY 
    consecutive_count;
