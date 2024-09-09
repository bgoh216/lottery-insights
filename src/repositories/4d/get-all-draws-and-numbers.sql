SELECT 
    -- d.draw_no,
    -- d.date,
    d.first_prize,
    d.second_prize,
    d.third_prize,
    STRING_AGG(DISTINCT c.prize, ', ' ORDER BY c.prize) AS consolation_prizes,
    STRING_AGG(DISTINCT s.prize, ', ' ORDER BY s.prize) AS starter_prizes
FROM 
    public."4D_Draw" d
LEFT JOIN 
    public."4D_Consolation" c ON d.draw_no = c.draw_no
LEFT JOIN 
    public."4D_Starter" s ON d.draw_no = s.draw_no
GROUP BY 
    d.draw_no, d.date, d.first_prize, d.second_prize, d.third_prize
ORDER BY 
    d.draw_no DESC;