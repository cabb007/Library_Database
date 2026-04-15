DELIMITER $$

-- =========================================================
-- Library Database Update Procedures
-- Run this file against the DB to add edit/update support.
-- =========================================================


-- =========================================================
-- Procedure: Update a user's info (librarian only)
-- Cannot change UserType to/from Librarian (2).
-- =========================================================
DROP PROCEDURE IF EXISTS UpdateUser$$
CREATE PROCEDURE UpdateUser(
    IN p_UserID INT,
    IN p_FirstName VARCHAR(30),
    IN p_LastName VARCHAR(30),
    IN p_Email VARCHAR(50),
    IN p_UserType SMALLINT,
    IN p_Status SMALLINT,
    IN p_Balance DECIMAL(7,2),
    IN p_UpdatedBy INT
)
BEGIN
    DECLARE v_existingType SMALLINT DEFAULT 0;
    DECLARE v_LoanPeriodDays INT DEFAULT 7;

    SELECT UserType INTO v_existingType FROM users WHERE UserID = p_UserID;

    -- Prevent promoting a non-librarian to librarian
    IF p_UserType = 2 AND v_existingType != 2 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot promote user to Librarian.';
    END IF;

    -- Prevent demoting a librarian
    IF v_existingType = 2 AND p_UserType != 2 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot change a Librarian user type.';
    END IF;

    IF p_Balance < 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Balance cannot be negative.';
    END IF;

    -- Auto-set loan period based on user type (mirrors AddUser logic)
    IF p_UserType = 0 THEN
        SET v_LoanPeriodDays = 7;   -- Student
    ELSEIF p_UserType = 1 THEN
        SET v_LoanPeriodDays = 14;  -- Faculty
    ELSE
        -- Librarian: keep existing value since type cannot change
        SELECT LoanPeriodDays INTO v_LoanPeriodDays FROM users WHERE UserID = p_UserID;
    END IF;

    UPDATE users
    SET
        FirstName = p_FirstName,
        LastName = p_LastName,
        Email = p_Email,
        UserType = p_UserType,
        Status = p_Status,
        LoanPeriodDays = v_LoanPeriodDays,
        Balance = p_Balance,
        UpdatedAt = NOW(),
        UpdatedBy = p_UpdatedBy
    WHERE UserID = p_UserID;

    IF ROW_COUNT() = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'User not found.';
    END IF;
END$$

-- =========================================================
-- Procedure: Add a single copy to an existing item
-- =========================================================
DROP PROCEDURE IF EXISTS AddCopy$$
CREATE PROCEDURE AddCopy(
    IN p_ItemID BIGINT,
    IN p_LibrarianID INT
)
BEGIN
    DECLARE v_NextCopyID INT;

    IF NOT EXISTS (SELECT 1 FROM items WHERE ItemID = p_ItemID) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Item not found.';
    END IF;

    SELECT COALESCE(MAX(CopyID), 0) INTO v_NextCopyID FROM copies;

    INSERT INTO copies (CopyID, ItemID, CopyStatus, CreatedBy, UpdatedBy)
    VALUES (v_NextCopyID + 1, p_ItemID, 0, p_LibrarianID, p_LibrarianID);
END$$


-- =========================================================
-- Procedure: Update a literature item
-- =========================================================
DROP PROCEDURE IF EXISTS UpdateLiterature$$
CREATE PROCEDURE UpdateLiterature(
    IN p_ItemID BIGINT,
    IN p_Title VARCHAR(100),
    IN p_ItemType SMALLINT,
    IN p_Author VARCHAR(100),
    IN p_Publisher VARCHAR(100),
    IN p_PublicationYear INT,
    IN p_UpdatedBy INT
)
BEGIN
    IF p_ItemType NOT IN (1, 2, 3, 4) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Invalid literature type. Must be 1=Book, 2=Textbook, 3=Magazine, 4=Audiobook.';
    END IF;

    IF p_PublicationYear IS NOT NULL AND p_PublicationYear <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Publication year must be a positive number.';
    END IF;

    UPDATE items
    SET
        Title = p_Title,
        UpdatedAt = NOW(),
        UpdatedBy = p_UpdatedBy
    WHERE ItemID = p_ItemID AND ItemCategory = 1;

    IF ROW_COUNT() = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Literature item not found.';
    END IF;

    UPDATE literature
    SET
        ItemType = p_ItemType,
        Author = p_Author,
        Publisher = p_Publisher,
        PublicationYear = p_PublicationYear
    WHERE ItemID = p_ItemID;
END$$

-- =========================================================
-- Procedure: Update a media item
-- =========================================================
DROP PROCEDURE IF EXISTS UpdateMedia$$
CREATE PROCEDURE UpdateMedia(
    IN p_ItemID BIGINT,
    IN p_Title VARCHAR(100),
    IN p_ItemType SMALLINT,
    IN p_Producer VARCHAR(100),
    IN p_DurationMinutes INT,
    IN p_UpdatedBy INT
)
BEGIN
    IF p_ItemType NOT IN (1, 2, 3) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Invalid media type. Must be 1=DVD/CD, 2=Blu-ray, 3=Vinyl.';
    END IF;

    IF p_DurationMinutes IS NOT NULL AND p_DurationMinutes <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Duration must be a positive number.';
    END IF;

    UPDATE items
    SET
        Title = p_Title,
        UpdatedAt = NOW(),
        UpdatedBy = p_UpdatedBy
    WHERE ItemID = p_ItemID AND ItemCategory = 2;

    IF ROW_COUNT() = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Media item not found.';
    END IF;

    UPDATE media
    SET
        ItemType = p_ItemType,
        Producer = p_Producer,
        DurationMinutes = p_DurationMinutes
    WHERE ItemID = p_ItemID;
END$$


-- =========================================================
-- Procedure: Update a device item
-- =========================================================
DROP PROCEDURE IF EXISTS UpdateDevice$$
CREATE PROCEDURE UpdateDevice(
    IN p_ItemID BIGINT,
    IN p_Title VARCHAR(100),
    IN p_ItemType SMALLINT,
    IN p_Manufacturer VARCHAR(100),
    IN p_Model VARCHAR(100),
    IN p_UpdatedBy INT
)
BEGIN
    IF p_ItemType NOT IN (1, 2, 3) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Invalid device type. Must be 1=Laptop, 2=Tablet, 3=Calculator.';
    END IF;

    UPDATE items
    SET
        Title = p_Title,
        UpdatedAt = NOW(),
        UpdatedBy = p_UpdatedBy
    WHERE ItemID = p_ItemID AND ItemCategory = 3;

    IF ROW_COUNT() = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Device item not found.';
    END IF;

    UPDATE devices
    SET
        ItemType = p_ItemType,
        Manufacturer = p_Manufacturer,
        Model = p_Model
    WHERE ItemID = p_ItemID;
END$$

DELIMITER ;
