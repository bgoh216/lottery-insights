-- Winning Number Distribution (Bar Chart or Histogram)
WITH all_numbers AS (
    SELECT winning_number_1 as number FROM public."Draw"
    UNION ALL SELECT winning_number_2 FROM public."Draw"
    UNION ALL SELECT winning_number_3 FROM public."Draw"
    UNION ALL SELECT winning_number_4 FROM public."Draw"
    UNION ALL SELECT winning_number_5 FROM public."Draw"
    UNION ALL SELECT winning_number_6 FROM public."Draw"
    UNION ALL SELECT additional_number FROM public."Draw"
)
SELECT 
    number,
    COUNT(number) as frequency
FROM 
    all_numbers
GROUP BY 
    number
ORDER BY 
    number;
