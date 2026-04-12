DELIMITER $$

-- =========================================================
-- Library Database Stored Procedures - Media, Devices, Literature
-- =========================================================



-- =========================================================
-- Function: Get all available copies of a specific item
-- =========================================================

CREATE FUNCTION GetAvailableCopies(p_ItemID BIGINT)
RETURNS INT
DETERMINISTIC
BEGIN
    DECLARE available INT;

    SELECT COUNT(*) INTO available
    FROM copies
    WHERE ItemID = p_ItemID
      AND CopyStatus = 0;

    RETURN available;
END$$

-- =========================================================
-- Procedure: Get all media items
-- =========================================================
DROP PROCEDURE IF EXISTS GetMedia$$
CREATE PROCEDURE GetMedia()
BEGIN
    SELECT 
        i.ItemID,
        i.Title,
        m.Producer,
        m.DurationMinutes,
        GetAvailableCopies(i.ItemID) AS AvailableCopies
    FROM items i
    JOIN media m ON i.ItemID = m.ItemID
    WHERE i.ItemCategory = 2
    ORDER BY i.Title;
END$$


-- =========================================================
-- Procedure: Get all devices data
-- =========================================================
DROP PROCEDURE IF EXISTS GetDevices$$
CREATE PROCEDURE GetDevices()
BEGIN
    SELECT 
        i.ItemID,
        i.Title,
        d.Manufacturer,
        d.Model,
        GetAvailableCopies(i.ItemID) AS AvailableCopies
    FROM items i
    JOIN devices d ON i.ItemID = d.ItemID
    WHERE i.ItemCategory = 3
    ORDER BY i.Title;
END$$


-- =========================================================
-- Procedure: Get all literature data
-- =========================================================
DROP PROCEDURE IF EXISTS GetLiterature$$
CREATE PROCEDURE GetLiterature()
BEGIN
    SELECT 
        i.ItemID,
        i.Title,
        l.Author,
        l.Publisher,
        l.PublicationYear,
        GetAvailableCopies(i.ItemID) AS AvailableCopies
    FROM items i
    JOIN literature l ON i.ItemID = l.ItemID
    WHERE i.ItemCategory = 1
    ORDER BY i.Title;
END$$

-- =========================================================
-- Procedure: Get item availability summary of whole catalog
-- =========================================================
DROP PROCEDURE IF EXISTS GetItemCatalog$$
CREATE PROCEDURE GetItemCatalog()
BEGIN
    SELECT 
        i.ItemID,
        i.ItemCategory,
        i.Title,
        COUNT(c.CopyID) AS TotalCopies,
        SUM(CASE WHEN c.CopyStatus = 0 THEN 1 ELSE 0 END) AS AvailableCopies
    FROM items as i
    LEFT JOIN copies AS c ON i.ItemID = c.ItemID -- keeps items even if they have no copies currently
    GROUP BY i.ItemID, i.ItemCategory, i.Title
    ORDER BY i.Title;
END$$


-- =========================================================
-- Procedure: Get all users
-- =========================================================
DROP PROCEDURE IF EXISTS GetUsers$$
CREATE PROCEDURE GetUsers()
BEGIN
    SELECT * FROM users
    ORDER BY UserID;
END$$

-- =================================================================================================================
--                                               LOANS AND FINES QUERIES
-- =================================================================================================================

-- =========================================================
-- Procedure: Get all active loans (with user and item details)
-- =========================================================
DROP PROCEDURE IF EXISTS GetActiveLoans$$
CREATE PROCEDURE GetActiveLoans()
BEGIN
    SELECT
        l.LoanID,
        l.UserID,
        CONCAT(u.FirstName, ' ', u.LastName) AS UserName, -- combining names for legibility
        l.CopyID,
        c.ItemID,
        i.Title,
        l.CheckoutDate,
        l.Duedate
    FROM loans AS l
    JOIN users AS u ON l.UserID= u.UserID
    JOIN copies AS c ON l.CopyID = c.CopyID
    JOIN items AS i ON c.ItemID = i.ItemID
    WHERE l.ReturnDate IS NULL -- only active loans (not returned yet)
    ORDER BY l.DueDate;
END$$

-- =========================================================
-- Procedure: Get all overdue loans (with user and item details)
-- =========================================================
DROP PROCEDURE IF EXISTS GetOverdueLoans$$
CREATE PROCEDURE GetOverdueLoans()
BEGIN
    SELECT
        l.LoanID,
        l.UserID,
        CONCAT(u.FirstName, ' ', u.LastName) AS UserName,
        l.CopyID,
        c.ItemID,
        i.Title,
        l.CheckoutDate,
        l.Duedate
    FROM loans AS l
    JOIN users AS u ON l.UserID = u.UserID
    JOIN copies AS c ON l.CopyID = c.CopyID
    JOIN items AS i ON c.ItemID = i.ItemID
    WHERE l.ReturnDate IS NULL
      AND l.Duedate < CURDATE() -- only overdue loans
    ORDER BY l.DueDate;
END$$


-- =========================================================
-- Procedure: Get all fines (with user details)
-- =========================================================
DROP PROCEDURE IF EXISTS GetFines$$
CREATE PROCEDURE GetFines()
BEGIN
    SELECT
        f.FineID,
        f.UserID,
        CONCAT(u.FirstName, ' ', u.LastName) AS UserName,
        f.Amount,
        f.Reason,
        f.CreatedAt
    FROM fines AS f
    JOIN users AS u ON f.UserID = u.UserID
    ORDER BY f.CreatedAt DESC; -- newest fines first
END$$

-- =========================================================
-- NEW: Procedure to get title for selected item
-- =========================================================
DROP PROCEDURE IF EXISTS getTitle$$
CREATE PROCEDURE getTitle(IN p_ItemID BIGINT)
BEGIN
    SELECT 
        Title As Title
    FROM items
    WHERE ItemID = p_ItemID;
END$$

DELIMITER ;