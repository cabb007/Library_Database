SET GLOBAL event_scheduler = ON;

DELIMITER $$

CREATE PROCEDURE midnight_task()
BEGIN
    -- Charge users for overdue loans (based purely on dates)
    UPDATE users u
    JOIN (
        SELECT UserID, COUNT(*) AS overdue_count
        FROM loans
        WHERE DueDate < CURDATE()
          AND ReturnDate IS NULL
        GROUP BY UserID
    ) l ON u.UserID = l.UserID
    SET u.Balance = u.Balance + (l.overdue_count * 2.00),
        u.UpdatedAt = CURRENT_TIMESTAMP,
        u.UpdatedBy = NULL;
END $$

DELIMITER ;

CREATE EVENT run_midnight_task
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_DATE + INTERVAL 1 DAY
DO
CALL midnight_task();