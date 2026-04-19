DELIMITER $$

-- =========================================================
-- Procedure: Get top librarian
-- =========================================================
DROP PROCEDURE IF EXISTS GetTopLibrarian $$
CREATE PROCEDURE GetTopLibrarian()
BEGIN
    SELECT u.UserID, u.FirstName, u.LastName, COUNT(*) AS actions
    FROM (
        SELECT CreatedBy FROM users  WHERE CreatedBy IS NOT NULL AND CreatedBy > 1
        UNION ALL
        SELECT CreatedBy FROM items  WHERE CreatedBy IS NOT NULL AND CreatedBy > 1
        UNION ALL
        SELECT CreatedBy FROM copies WHERE CreatedBy IS NOT NULL AND CreatedBy > 1
        UNION ALL
        SELECT CreatedBy FROM holds  WHERE CreatedBy IS NOT NULL AND CreatedBy > 1
        UNION ALL
        SELECT CreatedBy FROM loans  WHERE CreatedBy IS NOT NULL AND CreatedBy > 1
        UNION ALL
        SELECT CreatedBy FROM fines  WHERE CreatedBy IS NOT NULL AND CreatedBy > 1
    ) AS activity
    JOIN users u ON u.UserID = activity.CreatedBy
    GROUP BY u.UserID, u.FirstName, u.LastName
    ORDER BY actions DESC
    LIMIT 1;
END $$

-- =================================================================================================================
--                                              ITEM ANALYTICS QUERIES
-- =================================================================================================================

-- =========================================================
-- Procedure: Overview dashboard stats
-- =========================================================
DROP PROCEDURE IF EXISTS GetOverviewStats$$
CREATE PROCEDURE GetOverviewStats()
BEGIN
    SELECT
        (SELECT COUNT(*) FROM users) AS TotalUsers,
        (SELECT COUNT(*) FROM loans WHERE ReturnDate IS NULL) AS ActiveLoans,
        (SELECT COUNT(*) FROM loans WHERE ReturnDate IS NULL AND DueDate < CURDATE()) AS OverdueLoans,
        (SELECT COALESCE(SUM(FineAmount), 0) FROM fines WHERE PaidStatus = 0) AS TotalFinesOwed;
END$$

-- =========================================================
-- Procedure: Overall analytics summary (all-time, filter-independent)
-- =========================================================
DROP PROCEDURE IF EXISTS GetAnalyticsSummary$$
CREATE PROCEDURE GetAnalyticsSummary()
BEGIN
    SELECT
        (SELECT COUNT(*) FROM loans) AS TotalCheckouts,

        (SELECT COUNT(DISTINCT c.ItemID)
         FROM loans lo
         JOIN copies c ON lo.CopyID = c.CopyID) AS UniqueItemsCheckedOut,

        (SELECT TypeLabel FROM (
             SELECT CASE i.ItemCategory
                 WHEN 1 THEN CASE l.ItemType
                     WHEN 1 THEN 'Book' WHEN 2 THEN 'Textbook'
                     WHEN 3 THEN 'Magazine' WHEN 4 THEN 'Audiobook' ELSE '—' END
                 WHEN 2 THEN CASE m.ItemType
                     WHEN 1 THEN 'DVD/CD' WHEN 2 THEN 'Blu-ray'
                     WHEN 3 THEN 'Vinyl' ELSE '—' END
                 WHEN 3 THEN CASE d.ItemType
                     WHEN 1 THEN 'Laptop' WHEN 2 THEN 'Tablet'
                     WHEN 3 THEN 'Calculator' ELSE '—' END
                 ELSE '—'
             END AS TypeLabel
             FROM loans lo
             JOIN copies c ON lo.CopyID = c.CopyID
             JOIN items  i ON c.ItemID  = i.ItemID
             LEFT JOIN literature l ON i.ItemID = l.ItemID AND i.ItemCategory = 1
             LEFT JOIN media      m ON i.ItemID = m.ItemID AND i.ItemCategory = 2
             LEFT JOIN devices    d ON i.ItemID = d.ItemID AND i.ItemCategory = 3
         ) AS tl
         GROUP BY TypeLabel
         ORDER BY COUNT(*) DESC
         LIMIT 1) AS TopType,

        (SELECT i.Title
         FROM loans lo
         JOIN copies c ON lo.CopyID = c.CopyID
         JOIN items  i ON c.ItemID  = i.ItemID
         GROUP BY i.ItemID, i.Title
         ORDER BY COUNT(*) DESC
         LIMIT 1) AS TopItemTitle,

        (SELECT COUNT(*) FROM loans WHERE ReturnDate IS NULL) AS CurrentlyCheckedOut,

        (SELECT COUNT(*) FROM loans WHERE ReturnDate IS NULL AND DueDate < CURDATE()) AS OverdueItems,

        (SELECT ROUND(AVG(DATEDIFF(ReturnDate, CreatedAt)), 1)
         FROM loans
         WHERE ReturnDate IS NOT NULL) AS AvgLoanDays;
END$$

-- =========================================================
-- Procedure: Get most checked out items with filters
--   p_start_date  DATE      - earliest checkout date (NULL = no lower bound)
--   p_end_date    DATE      - latest checkout date   (NULL = no upper bound)
--   p_category    SMALLINT  - 1=Literature, 2=Media, 3=Device (NULL = all)
--   p_item_type   SMALLINT  - type within category (NULL = all types)
-- =========================================================
DROP PROCEDURE IF EXISTS GetMostCheckedOut$$
CREATE PROCEDURE GetMostCheckedOut(
    IN p_start_date DATE,
    IN p_end_date   DATE,
    IN p_category   SMALLINT,
    IN p_item_type  SMALLINT
)
BEGIN
    SELECT
        i.ItemID,
        i.Title,
        i.ItemCategory,
        CASE i.ItemCategory
            WHEN 1 THEN 'Literature'
            WHEN 2 THEN 'Media'
            WHEN 3 THEN 'Device'
            ELSE 'Unknown'
        END AS CategoryLabel,
        COALESCE(l.ItemType, m.ItemType, d.ItemType) AS ItemType,
        CASE i.ItemCategory
            WHEN 1 THEN CASE l.ItemType
                WHEN 1 THEN 'Book'
                WHEN 2 THEN 'Textbook'
                WHEN 3 THEN 'Magazine'
                WHEN 4 THEN 'Audiobook'
                ELSE '—'
            END
            WHEN 2 THEN CASE m.ItemType
                WHEN 1 THEN 'DVD/CD'
                WHEN 2 THEN 'Blu-ray'
                WHEN 3 THEN 'Vinyl'
                ELSE '—'
            END
            WHEN 3 THEN CASE d.ItemType
                WHEN 1 THEN 'Laptop'
                WHEN 2 THEN 'Tablet'
                WHEN 3 THEN 'Calculator'
                ELSE '—'
            END
            ELSE '—'
        END AS TypeLabel,
        COUNT(lo.LoanID) AS CheckoutCount,
        ROUND(AVG(CASE WHEN lo.ReturnDate IS NOT NULL THEN DATEDIFF(lo.ReturnDate, lo.CreatedAt) END), 1) AS AvgLoanDays,
        (SELECT COUNT(*)
         FROM copies c2
         JOIN loans lo2 ON c2.CopyID = lo2.CopyID
         WHERE c2.ItemID = i.ItemID
           AND lo2.ReturnDate IS NULL) AS CurrentlyCheckedOut,
        (SELECT COUNT(*)
         FROM copies c2
         JOIN loans lo2 ON c2.CopyID = lo2.CopyID
         WHERE c2.ItemID = i.ItemID
           AND lo2.ReturnDate IS NULL
           AND lo2.DueDate < CURDATE()) AS OverdueCount
    FROM items AS i
    LEFT JOIN literature AS l ON i.ItemID = l.ItemID AND i.ItemCategory = 1
    LEFT JOIN media      AS m ON i.ItemID = m.ItemID AND i.ItemCategory = 2
    LEFT JOIN devices    AS d ON i.ItemID = d.ItemID AND i.ItemCategory = 3
    JOIN copies AS c ON i.ItemID = c.ItemID
    JOIN loans  AS lo ON c.CopyID = lo.CopyID
    WHERE
        (p_start_date IS NULL OR DATE(lo.CreatedAt) >= p_start_date)
        AND (p_end_date IS NULL OR DATE(lo.CreatedAt) <= p_end_date)
        AND (p_category IS NULL OR i.ItemCategory = p_category)
        AND (
            p_item_type IS NULL
            OR (i.ItemCategory = 1 AND l.ItemType = p_item_type)
            OR (i.ItemCategory = 2 AND m.ItemType = p_item_type)
            OR (i.ItemCategory = 3 AND d.ItemType = p_item_type)
        )
    GROUP BY
        i.ItemID, i.Title, i.ItemCategory,
        l.ItemType, m.ItemType, d.ItemType
    ORDER BY CheckoutCount DESC;
END$$

-- =================================================================================================================
--                                              TRANSACTION ANALYTICS QUERIES
-- =================================================================================================================

-- =========================================================
-- Procedure: Get transaction summary of all loans/holds/fines (totals, actives, overdues, averages)
-- =========================================================
DROP PROCEDURE IF EXISTS GetTransactionSummary$$
CREATE PROCEDURE GetTransactionSummary()
BEGIN
    SELECT
        (SELECT COUNT(*) FROM loans) AS TotalLoans,
        (SELECT COUNT(*) FROM loans WHERE ReturnDate IS NULL) AS ActiveLoans,
        (SELECT COUNT(*)
         FROM loans
         WHERE ReturnDate IS NULL -- Active loans only
           AND DueDate < CURDATE()) AS OverdueLoans,
        (SELECT COUNT(*) FROM holds) AS TotalHolds,
        (SELECT COUNT(*) FROM holds WHERE HoldStatus = 0) AS ActiveHolds,
        (SELECT COUNT(*) FROM holds WHERE HoldStatus = 1) AS FulfilledHolds,
        (SELECT COUNT(*) FROM holds WHERE HoldStatus = 2) AS CancelledHolds,
        (SELECT COUNT(*) FROM fines) AS TotalFines,
        (SELECT COUNT(*) FROM fines WHERE PaidStatus = 0) AS UnpaidFines,
        (SELECT COUNT(*) FROM fines WHERE PaidStatus = 1) AS PaidFines,
        (SELECT COALESCE(SUM(FineAmount), 0.00)
         FROM fines
         WHERE PaidStatus = 0) AS TotalOutstandingFineAmount,
        (SELECT ROUND(AVG(DATEDIFF(ReturnDate, CreatedAt)), 1)
         FROM loans
         WHERE ReturnDate IS NOT NULL) AS AvgCompletedLoanDays,
        (SELECT ROUND(AVG(DATEDIFF(COALESCE(UpdatedAt, CURDATE()), CreatedAt)), 1)
         FROM holds) AS AvgHoldLifecycleDays;
END$$


DROP PROCEDURE IF EXISTS GetTransactionReport$$
CREATE PROCEDURE GetTransactionReport(
    IN p_start_date DATE,
    IN p_end_date DATE,
    IN p_user_id INT,
    IN p_transaction_type VARCHAR(10) -- 'Loan', 'Hold', 'Fine', NULL = all
)
BEGIN
    -- Loans
    SELECT
        'Loan' AS TransactionType,
        lo.LoanID AS TransactionID,
        u.UserID,
        CONCAT(u.FirstName, ' ', u.LastName) AS UserName,
        u.Email,
        i.ItemID,
        i.Title,
        lo.CreatedAt AS TransactionDate,
        lo.DueDate,
        lo.ReturnDate,
        NULL AS FineAmount,
        CASE
            WHEN lo.ReturnDate IS NOT NULL THEN 'Returned'
            WHEN lo.DueDate < CURDATE() THEN 'Overdue'
            ELSE 'Active'
        END AS StatusLabel,
        DATEDIFF(COALESCE(lo.ReturnDate, CURDATE()), lo.CreatedAt) AS AgeDays,
        CASE
            WHEN lo.ReturnDate IS NULL AND lo.DueDate < CURDATE()
                THEN DATEDIFF(CURDATE(), lo.DueDate)
            ELSE 0
        END AS DaysOverdue,
        CASE
            WHEN lo.ReturnDate IS NULL AND lo.DueDate < CURDATE() THEN 1
            ELSE 0
        END AS NeedsAttention
    FROM loans lo
    JOIN users u ON lo.UserID = u.UserID
    JOIN copies c ON lo.CopyID = c.CopyID
    JOIN items i ON c.ItemID = i.ItemID
    WHERE
        (p_start_date IS NULL OR DATE(lo.CreatedAt) >= p_start_date)
        AND (p_end_date IS NULL OR DATE(lo.CreatedAt) <= p_end_date)
        AND (p_user_id IS NULL OR lo.UserID = p_user_id)
        AND (p_transaction_type IS NULL OR p_transaction_type = 'Loan')

    UNION ALL

    -- Holds
    SELECT
        'Hold' AS TransactionType,
        h.HoldID AS TransactionID,
        u.UserID,
        CONCAT(u.FirstName, ' ', u.LastName) AS UserName,
        u.Email,
        i.ItemID,
        i.Title,
        h.CreatedAt AS TransactionDate,
        NULL AS DueDate,
        NULL AS ReturnDate,
        NULL AS FineAmount,
        CASE h.HoldStatus
            WHEN 0 THEN 'Active'
            WHEN 1 THEN 'Fulfilled'
            WHEN 2 THEN 'Cancelled'
            ELSE 'Unknown'
        END AS StatusLabel,
        DATEDIFF(COALESCE(h.UpdatedAt, CURDATE()), h.CreatedAt) AS AgeDays,
        0 AS DaysOverdue,
        CASE
            WHEN h.HoldStatus = 0 AND DATEDIFF(CURDATE(), h.CreatedAt) > 7 THEN 1
            ELSE 0
        END AS NeedsAttention
    FROM holds h
    JOIN users u ON h.UserID = u.UserID
    JOIN items i ON h.ItemID = i.ItemID
    WHERE
        (p_start_date IS NULL OR DATE(h.CreatedAt) >= p_start_date)
        AND (p_end_date IS NULL OR DATE(h.CreatedAt) <= p_end_date)
        AND (p_user_id IS NULL OR h.UserID = p_user_id)
        AND (p_transaction_type IS NULL OR p_transaction_type = 'Hold')

    UNION ALL

    -- Fines
    SELECT
        'Fine' AS TransactionType,
        f.FineID AS TransactionID,
        u.UserID,
        CONCAT(u.FirstName, ' ', u.LastName) AS UserName,
        u.Email,
        i.ItemID,
        i.Title,
        f.CreatedAt AS TransactionDate,
        lo.DueDate,
        lo.ReturnDate,
        f.FineAmount,
        CASE
            WHEN f.PaidStatus = 1 THEN 'Paid'
            ELSE 'Unpaid'
        END AS StatusLabel,
        DATEDIFF(COALESCE(f.PaidAt, CURDATE()), f.CreatedAt) AS AgeDays,
        0 AS DaysOverdue,
        CASE
            WHEN f.PaidStatus = 0 THEN 1
            ELSE 0
        END AS NeedsAttention
    FROM fines f
    JOIN users u ON f.UserID = u.UserID
    JOIN loans lo ON f.LoanID = lo.LoanID
    JOIN copies c ON lo.CopyID = c.CopyID
    JOIN items i ON c.ItemID = i.ItemID
    WHERE
        (p_start_date IS NULL OR DATE(f.CreatedAt) >= p_start_date)
        AND (p_end_date IS NULL OR DATE(f.CreatedAt) <= p_end_date)
        AND (p_user_id IS NULL OR f.UserID = p_user_id)
        AND (p_transaction_type IS NULL OR p_transaction_type = 'Fine')

    ORDER BY TransactionDate DESC, TransactionType;
END$$


DELIMITER ;