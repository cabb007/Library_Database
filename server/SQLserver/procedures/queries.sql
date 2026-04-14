DELIMITER $$

-- =========================================================
-- Library Database Stored Procedures - Media, Devices, Literature
-- =========================================================

-- =================================================================================================================
--                                               ITEM QUERIES
-- =================================================================================================================


-- =========================================================
-- Function: Get all available copies of a specific item
-- =========================================================

DROP FUNCTION IF EXISTS GetAvailableCopies$$
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
-- Function: Get all copies of a specific item, and their copy status
-- =========================================================
DROP PROCEDURE IF EXISTS GetItemCopies$$
CREATE PROCEDURE GetItemCopies(IN p_ItemID BIGINT)
BEGIN
    SELECT
        c.CopyID,
        c.CopyStatus,
        i.ItemID,
        i.Title,
        i.ItemCategory
    FROM copies AS c
    JOIN items AS i ON c.ItemID = i.ItemID
    WHERE c.ItemID = p_ItemID;
END$$

-- =================================================================================================================
--                                               MEDIA QUERIES
-- =================================================================================================================

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
-- Procedure: Delete a media item
-- =========================================================
DROP PROCEDURE IF EXISTS DeleteMedia$$
CREATE PROCEDURE DeleteMedia(IN p_MediaID BIGINT)
BEGIN
    DECLARE v_activeLoans INT DEFAULT 0;
    DECLARE v_activeHolds INT DEFAULT 0;
    DECLARE Flag INT DEFAULT 0;

    -- Check for active loans (no JOIN)
    SELECT COUNT(*)
    INTO v_activeLoans
    FROM loans
    WHERE CopyID IN (
        SELECT CopyID
        FROM copies
        WHERE ItemID = p_MediaID
    )
    AND ReturnDate IS NULL;

    IF v_activeLoans > 0 THEN
        SET Flag = 1;
    END IF;

    -- Check for active holds
    SELECT COUNT(*)
    INTO v_activeHolds
    FROM holds
    WHERE ItemID = p_MediaID
      AND HoldStatus = 0;

    IF v_activeHolds > 0 THEN
        SET Flag = 1;
    END IF;

    -- Only delete if safe
    IF Flag = 0 THEN
        DELETE FROM media
        WHERE ItemID = p_MediaID;
    ELSE
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot delete media with active loans or holds.';
    END IF;

END$$
-- =========================================================
-- Procedure: Add a media item
-- =========================================================
DROP PROCEDURE IF EXISTS AddMedia$$
CREATE PROCEDURE AddMedia(
    IN p_ItemID BIGINT,
    IN p_Title VARCHAR(100),
    IN p_ItemType SMALLINT,
    IN p_Producer VARCHAR(100),
    IN p_DurationMinutes INT,
    IN p_Copies INT,
    IN p_LibrarianID INT
)
BEGIN
    DECLARE Flag INT DEFAULT 0;
    DECLARE v_NextCopyID INT;
    DECLARE i INT DEFAULT 0;

    -- Check if the item ID already exists
    IF EXISTS (
        SELECT 1
        FROM items
        WHERE ItemID = p_ItemID
    ) THEN
        SET Flag = 1;
    END IF;

    -- Check that the media type is valid
    IF p_ItemType NOT IN (1,2,3) THEN
        SET Flag = 1;
    END IF;

    -- Check that duration is positive if provided
    IF p_DurationMinutes IS NOT NULL AND p_DurationMinutes <= 0 THEN
        SET Flag = 1;
    END IF;

    -- Check that at least 1 copy is being added
    IF p_Copies IS NULL OR p_Copies < 1 THEN
        SET Flag = 1;
    END IF;

    -- Only insert if no error conditions were found
    IF Flag = 0 THEN
        INSERT INTO items (ItemID, ItemCategory, Title, CreatedBy, UpdatedBy)
        VALUES (p_ItemID, 2, p_Title, p_LibrarianID, p_LibrarianID);

        INSERT INTO media (ItemID, ItemType, Producer, DurationMinutes)
        VALUES (p_ItemID, p_ItemType, p_Producer, p_DurationMinutes);

        -- Generate CopyIDs sequentially and insert each copy
        SELECT COALESCE(MAX(CopyID), 0) INTO v_NextCopyID FROM copies;

        WHILE i < p_Copies DO
            SET v_NextCopyID = v_NextCopyID + 1;
            INSERT INTO copies (CopyID, ItemID, CopyStatus, CreatedBy, UpdatedBy)
            VALUES (v_NextCopyID, p_ItemID, 0, p_LibrarianID, p_LibrarianID);
            SET i = i + 1;
        END WHILE;

    ELSE
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Unable to add media. Check ItemID, ItemType, DurationMinutes, or Copies.';
    END IF;

END$$

-- =================================================================================================================
--                                               DEVICE QUERIES
-- =================================================================================================================

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
-- Procedure: Add a device item
-- =========================================================
DROP PROCEDURE IF EXISTS AddDevice$$
CREATE PROCEDURE AddDevice(
    IN p_ItemID BIGINT,
    IN p_Title VARCHAR(100),
    IN p_ItemType SMALLINT,
    IN p_Manufacturer VARCHAR(100),
    IN p_Model VARCHAR(100),
    IN p_LibrarianID INT
)
BEGIN
    DECLARE Flag INT DEFAULT 0;

    -- Check if the item ID already exists
    IF EXISTS (
        SELECT 1
        FROM items
        WHERE ItemID = p_ItemID
    ) THEN
        SET Flag = 1;
    END IF;

    -- Check that the device type is valid
    IF p_ItemType NOT IN (1,2,3) THEN
        SET Flag = 1;
    END IF;

    -- Only insert if no error conditions were found
    IF Flag = 0 THEN
        INSERT INTO items (
            ItemID,
            ItemCategory,
            Title,
            CreatedBy,
            UpdatedBy
        )
        VALUES (
            p_ItemID,
            3,
            p_Title,
            p_LibrarianID,
            p_LibrarianID
        );

        INSERT INTO devices (
            ItemID,
            ItemType,
            Manufacturer,
            Model
        )
        VALUES (
            p_ItemID,
            p_ItemType,
            p_Manufacturer,
            p_Model
        );
    ELSE
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Unable to add device. Check ItemID or ItemType.';
    END IF;

END$$

-- =========================================================
-- Procedure: Delete a device item
-- =========================================================
DROP PROCEDURE IF EXISTS DeleteDevice$$
CREATE PROCEDURE DeleteDevice(IN p_DeviceID BIGINT)
BEGIN
    DECLARE v_activeLoans INT DEFAULT 0;
    DECLARE v_activeHolds INT DEFAULT 0;
    DECLARE Flag INT DEFAULT 0;

    -- Check for active loans
    SELECT COUNT(*)
    INTO v_activeLoans
    FROM loans
    WHERE CopyID IN (
        SELECT CopyID
        FROM copies
        WHERE ItemID = p_DeviceID
    )
    AND ReturnDate IS NULL;

    IF v_activeLoans > 0 THEN
        SET Flag = 1;
    END IF;

    -- Check for active holds
    SELECT COUNT(*)
    INTO v_activeHolds
    FROM holds
    WHERE ItemID = p_DeviceID
      AND HoldStatus = 0;

    IF v_activeHolds > 0 THEN
        SET Flag = 1;
    END IF;

    -- Only delete if safe
    IF Flag = 0 THEN
        DELETE FROM devices
        WHERE ItemID = p_DeviceID;
    ELSE
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot delete device with active loans or holds.';
    END IF;

END$$

-- =================================================================================================================
--                                               LITERATURE QUERIES
-- =================================================================================================================

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
-- Procedure: Add a literature item
-- =========================================================
DROP PROCEDURE IF EXISTS AddLiterature$$
CREATE PROCEDURE AddLiterature(
    IN p_ItemID BIGINT,
    IN p_Title VARCHAR(100),
    IN p_ItemType SMALLINT,
    IN p_Author VARCHAR(100),
    IN p_Publisher VARCHAR(100),
    IN p_PublicationYear INT,
    IN p_Copies INT,
    IN p_LibrarianID INT
)
BEGIN
    DECLARE Flag INT DEFAULT 0;
    DECLARE v_NextCopyID INT;
    DECLARE i INT DEFAULT 0;

    -- Check if the item ID already exists
    IF EXISTS (
        SELECT 1
        FROM items
        WHERE ItemID = p_ItemID
    ) THEN
        SET Flag = 1;
    END IF;

    -- Check that the literature type is valid
    IF p_ItemType NOT IN (1,2,3,4) THEN
        SET Flag = 1;
    END IF;

    -- Check that publication year is positive if provided
    IF p_PublicationYear IS NOT NULL AND p_PublicationYear <= 0 THEN
        SET Flag = 1;
    END IF;

    -- Check that at least 1 copy is being added
    IF p_Copies IS NULL OR p_Copies < 1 THEN
        SET Flag = 1;
    END IF;

    -- Only insert if no error conditions were found
    IF Flag = 0 THEN
        INSERT INTO items (
            ItemID,
            ItemCategory,
            Title,
            CreatedBy,
            UpdatedBy
        )
        VALUES (
            p_ItemID,
            1,
            p_Title,
            p_LibrarianID,
            p_LibrarianID
        );

        INSERT INTO literature (
            ItemID,
            ItemType,
            Author,
            Publisher,
            PublicationYear
        )
        VALUES (
            p_ItemID,
            p_ItemType,
            p_Author,
            p_Publisher,
            p_PublicationYear
        );

        -- Generate CopyIDs sequentially and insert each copy
        SELECT COALESCE(MAX(CopyID), 0) INTO v_NextCopyID FROM copies;

        WHILE i < p_Copies DO
            SET v_NextCopyID = v_NextCopyID + 1;
            INSERT INTO copies (CopyID, ItemID, CopyStatus, CreatedBy, UpdatedBy)
            VALUES (v_NextCopyID, p_ItemID, 0, p_LibrarianID, p_LibrarianID);
            SET i = i + 1;
        END WHILE;

    ELSE
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Unable to add literature. Check ItemID, ItemType, PublicationYear, or Copies.';
    END IF;

END$$

-- =========================================================
-- Procedure: Delete a literature item
-- =========================================================
DROP PROCEDURE IF EXISTS DeleteLiterature$$
CREATE PROCEDURE DeleteLiterature(IN p_LiteratureID BIGINT)
BEGIN
    DECLARE v_activeLoans INT DEFAULT 0;
    DECLARE v_activeHolds INT DEFAULT 0;
    DECLARE Flag INT DEFAULT 0;

    -- Check for active loans
    SELECT COUNT(*)
    INTO v_activeLoans
    FROM loans
    WHERE CopyID IN (
        SELECT CopyID
        FROM copies
        WHERE ItemID = p_LiteratureID
    )
    AND ReturnDate IS NULL;

    IF v_activeLoans > 0 THEN
        SET Flag = 1;
    END IF;

    -- Check for active holds
    SELECT COUNT(*)
    INTO v_activeHolds
    FROM holds
    WHERE ItemID = p_LiteratureID
      AND HoldStatus = 0;

    IF v_activeHolds > 0 THEN
        SET Flag = 1;
    END IF;

    -- Only delete if safe
    IF Flag = 0 THEN
        DELETE FROM copies WHERE ItemID = p_LiteratureID;
        DELETE FROM literature WHERE ItemID = p_LiteratureID;
        DELETE FROM items WHERE ItemID = p_LiteratureID;
    ELSE
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot delete literature with active loans or holds.';
    END IF;

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

DELIMITER ;