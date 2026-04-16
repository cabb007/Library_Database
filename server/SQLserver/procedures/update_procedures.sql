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
    DECLARE v_LoanPeriodDays INT DEFAULT 14;

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

    -- Validate user type
    IF p_UserType NOT IN (0,1,2) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Invalid user type.';
    END IF;

    IF p_Status NOT IN (0,1) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Invalid status.';
    END IF;

    -- Check for duplicate email if it's being changed
    IF EXISTS (
        SELECT 1
        FROM users
        WHERE Email = p_Email
          AND UserID <> p_UserID
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'A user with that email already exists.';
    END IF;

    -- Auto-set loan period based on user type (mirrors AddUser logic)
    IF p_UserType = 0 THEN
        SET v_LoanPeriodDays = 14;   -- Student
    ELSEIF p_UserType = 1 THEN
        SET v_LoanPeriodDays = 30;  -- Faculty
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
        UpdatedAt = CURRENT_TIMESTAMP(),
        UpdatedBy = p_UpdatedBy
    WHERE UserID = p_UserID;

    IF ROW_COUNT() = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'User not found.';
    END IF;
END$$

-- =========================================================
-- Procedure: Add a single copy (blocks if copy exists or item ID does not exist)
-- =========================================================
DROP PROCEDURE IF EXISTS AddCopy$$
CREATE PROCEDURE AddCopy(
    IN p_ItemID BIGINT,
    IN p_CopyStatus SMALLINT, -- CopyStatus: 0=Available, 1=OnLoan
    IN p_LibrarianID INT -- Use LibrarianID for CreatedBy and UpdatedBy
    -- IN p_CopyID INT -- Optional: if provided, will attempt to use this CopyID instead of auto-generating
) 
BEGIN
    DECLARE Flag INT DEFAULT 0;

    -- Check if the item ID exists
    IF NOT EXISTS (
        SELECT 1
        FROM items
        WHERE ItemID = p_ItemID
    ) THEN
        SET Flag = 1;
    END IF;

    -- Check that the copy status is valid
    IF p_CopyStatus NOT IN (0,1) THEN
        SET Flag = 1;
    END IF;

     -- Validate librarian exists
    IF NOT EXISTS (
        SELECT 1 FROM users WHERE UserID = p_LibrarianID
    ) THEN
        SET Flag = 1;
    END IF;

    -- Only insert if no error conditions were found
    IF Flag = 0 THEN
        INSERT INTO copies (
            ItemID,
            CopyStatus,
            CreatedBy,
            UpdatedBy
        ) VALUES (
            p_ItemID,
            p_CopyStatus,
            p_LibrarianID,
            p_LibrarianID
        );
    ELSE
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Unable to add copy. Check ItemID or CopyStatus.';
    END IF;
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
        UpdatedAt = CURRENT_TIMESTAMP(),
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
        UpdatedAt = CURRENT_TIMESTAMP(),
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
        UpdatedAt = CURRENT_TIMESTAMP(),
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
