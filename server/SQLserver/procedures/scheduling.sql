SET GLOBAL event_scheduler = ON;

DELIMITER $$

-- =========================================================
-- Procedure: Daily midnight task, creates missing fines for newly overdue loans, then updates all unpaid overdue fine amounts
-- =========================================================
DROP PROCEDURE IF EXISTS midnightTask$$
CREATE PROCEDURE midnightTask()
BEGIN
    -- Create missing fine rows for newly overdue loans
    INSERT INTO fines (
        UserID,
        LoanID,
        FineAmount,
        PaidStatus,
        PaidAt,
        CreatedAt,
        CreatedBy,
        UpdatedAt,
        UpdatedBy
    )
    SELECT
        l.UserID,
        l.LoanID,
        GREATEST(DATEDIFF(COALESCE(l.ReturnDate, CURDATE()), l.DueDate), 0) * 2.00,
        0,
        NULL,
        CURRENT_TIMESTAMP,
        1, -- SysAdmin UserID = 1
        CURRENT_TIMESTAMP,
        NULL
    FROM loans l
    LEFT JOIN fines f ON f.LoanID = l.LoanID
    WHERE f.FineID IS NULL
      AND l.DueDate < CURDATE();

    -- Update all existing unpaid fines
    UPDATE fines f
    JOIN loans l ON f.LoanID = l.LoanID
    SET f.FineAmount = GREATEST(DATEDIFF(COALESCE(l.ReturnDate, CURDATE()), l.DueDate), 0) * 2.00,
        f.UpdatedAt = CURRENT_TIMESTAMP,
        f.UpdatedBy = 1 -- SysAdmin UserID = 1
    WHERE f.PaidStatus = 0
      AND l.DueDate < CURDATE();
END$$

-- =========================================================
-- Event: Run midnight task every day
-- =========================================================
DROP EVENT IF EXISTS run_midnightTask$$
CREATE EVENT run_midnightTask
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_DATE + INTERVAL 1 DAY
DO
CALL midnightTask()$$
DELIMITER ;