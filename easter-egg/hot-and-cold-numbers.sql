-- Hot and Cold Numbers: Identify frequently and infrequently drawn numbers
WITH recent_draws AS (
    SELECT * FROM public."Draw"
    ORDER BY date DESC
    LIMIT 50
),
number_counts AS (
    SELECT unnest(ARRAY[
        winning_number_1, winning_number_2, winning_number_3,
        winning_number_4, winning_number_5, winning_number_6
    ]) AS number,
    COUNT(*) as frequency
    FROM recent_draws
    GROUP BY number
)
SELECT 
    number,
    frequency,
    CASE 
        WHEN frequency > AVG(frequency) OVER () THEN 'Hot'
        ELSE 'Cold'
    END AS number_status
FROM number_counts
ORDER BY frequency DESC;
