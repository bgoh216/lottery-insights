WITH lucky_locations AS (
    SELECT 
        a.address,
        COUNT(*) as winning_tickets_sold,
        SUM(wg.share_amount) as total_prize_money,
        AVG(wg.share_amount) as avg_prize_money
    FROM 
        public."Address" a
    JOIN 
        public."WinningGroup" wg ON a.winning_group_id = wg.winning_group_id
    GROUP BY 
        a.address
),
number_frequency AS (
    SELECT number, COUNT(*) as frequency
    FROM (
        SELECT winning_number_1 as number FROM public."Draw"
        UNION ALL SELECT winning_number_2 FROM public."Draw"
        UNION ALL SELECT winning_number_3 FROM public."Draw"
        UNION ALL SELECT winning_number_4 FROM public."Draw"
        UNION ALL SELECT winning_number_5 FROM public."Draw"
        UNION ALL SELECT winning_number_6 FROM public."Draw"
        UNION ALL SELECT additional_number FROM public."Draw"
    ) all_numbers
    GROUP BY number
),
best_days AS (
    SELECT 
        EXTRACT(DOW FROM d.date) as day_of_week,
        TO_CHAR(d.date, 'Day') as day_name,
        COUNT(*) as total_draws,
        SUM(CASE WHEN wg.group_no = 1 THEN 1 ELSE 0 END) as group1_wins,
        AVG(d.group_1_prize) as avg_group1_prize
    FROM 
        public."Draw" d
    LEFT JOIN 
        public."WinningGroup" wg ON d.draw_no = wg.draw_no
    GROUP BY 
        day_of_week, day_name
)
SELECT * FROM (
    SELECT 
        'Best Locations' as category,
        ll.address as detail,
        ll.winning_tickets_sold as winning_tickets,
        ll.total_prize_money as total_winnings,
        ll.avg_prize_money as average_prize,
        1 as sort_order,
        ROW_NUMBER() OVER (ORDER BY ll.winning_tickets_sold DESC, ll.total_prize_money DESC) as row_num
    FROM 
        lucky_locations ll

    UNION ALL

    SELECT 
        'Highest Occurring Numbers' as category,
        nf.number::text as detail,
        nf.frequency as occurrence_count,
        NULL as not_applicable_1,
        NULL as not_applicable_2,
        2 as sort_order,
        ROW_NUMBER() OVER (ORDER BY nf.frequency DESC) as row_num
    FROM 
        number_frequency nf

    UNION ALL

    SELECT 
        'Best Days to Buy' as category,
        bd.day_name as detail,
        bd.total_draws as total_draws,
        bd.group1_wins as group1_wins,
        bd.avg_group1_prize as avg_group1_prize,
        3 as sort_order,
        ROW_NUMBER() OVER (ORDER BY bd.group1_wins DESC, bd.avg_group1_prize DESC) as row_num
    FROM 
        best_days bd
) subquery
WHERE 
    (sort_order = 1 AND row_num <= 5) OR
    (sort_order = 2 AND row_num <= 7) OR
    (sort_order = 3 AND row_num <= 3)
ORDER BY 
    sort_order, row_num;
