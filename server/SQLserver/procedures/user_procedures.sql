DELIMITER $$


-- =========================================================
-- Library Database User Procedures - GetUsers, CreateUser, DeleteUser
-- =========================================================


-- =========================================================
-- Procedure: Get all users
-- =========================================================
DROP PROCEDURE IF EXISTS GetUsers$$
CREATE PROCEDURE GetUsers()
BEGIN
    SELECT * FROM users
    ORDER BY UserID;
END$$


-- =========================================================
-- Procedure: Delete a specific user by ID
-- =========================================================
DROP PROCEDURE IF EXISTS DeleteUser$$
CREATE PROCEDURE DeleteUser(IN p_UserID INT)
BEGIN
    DECLARE v_activeLoans INT;
    DECLARE v_activeHolds INT;
    DECLARE v_unpaidFines INT;

    -- Check for active loans
    SELECT COUNT(*) INTO v_activeLoans
    FROM loans
    WHERE UserID = p_UserID
      AND ReturnDate IS NULL;
    
    IF v_activeLoans > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot delete user with active loans.';
    END IF;

    -- Check for active holds
    SELECT COUNT(*) INTO v_activeHolds
    FROM holds
    WHERE UserID = p_UserID
        AND HoldStatus = 0; -- Active holds
    
    IF v_activeHolds > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot delete user with active holds.';
    END IF;

    -- Check for unpaid fines
    SELECT COUNT(*) INTO v_unpaidFines
    FROM fines
    WHERE UserID = p_UserID
        AND PaidStatus = 0
        AND FineAmount > 0;

    IF v_unpaidFines > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot delete user with unpaid fines.';
    END IF;

    -- If all checks pass, delete the user
    DELETE FROM users 
    WHERE UserID = p_UserID;

    -- Check if the user exists
    IF ROW_COUNT() = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'User not found.';
    END IF;
END$$

-- =========================================================
-- Procedure: Add a new user (librarian only)
-- =========================================================
DROP PROCEDURE IF EXISTS AddUser$$
CREATE PROCEDURE AddUser(
    IN p_Password VARCHAR(30),
    IN p_FirstName VARCHAR(30),
    IN p_LastName VARCHAR(30),
    IN p_Email VARCHAR(50),
    IN p_UserType SMALLINT,
    IN p_LibrarianID INT -- ID of the librarian creating the user, for auditing
)
BEGIN
    DECLARE v_LoanPeriodDays INT;

    -- == Critical validation errors ==

    -- Only allow UserType 0 (Student) and 1 (Faculty) to be created through this procedure
    IF p_UserType NOT IN (0, 1) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Can only create Student or Faculty accounts.';
    END IF;
    
    -- Password minimum length check
    IF p_Password IS NULL OR LENGTH(p_Password) < 6 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Password must be at least 6 characters long.';
    END IF;

    -- Checking for duplicate email before INSERT based on the UNIQUE constraint from users table
    IF EXISTS (
        SELECT 1
        FROM users
        WHERE Email = p_Email
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'A user with that email already exists.';
    END IF;
    -- ================================

    -- Set default loan period based on user type
    IF p_UserType = 0 THEN
        SET v_LoanPeriodDays = 14; -- Students get 14 days
    ELSE
        SET v_LoanPeriodDays = 30; -- Faculty get 30 days
    END IF;

    INSERT INTO users (
        Password,
        FirstName,
        LastName,
        Email,
        Balance,
        UserType,
        LoanPeriodDays,
        Status,
        CreatedBy, -- Set to the librarian creating the user for auditing
        UpdatedBy
    ) VALUES (
        p_Password,
        p_FirstName,
        p_LastName,
        p_Email,
        0.00, -- Default balance
        p_UserType,
        v_LoanPeriodDays,
        1, -- Active status
        p_LibrarianID, -- Will be used in server.js to set the creator/updater based on the logged-in librarian
        p_LibrarianID 
    );
END$$

-- =========================================================
-- Procedure: Create a new user (self-registration, default to student)
-- =========================================================
DROP PROCEDURE IF EXISTS CreateUser$$
CREATE PROCEDURE CreateUser(
    IN p_Password VARCHAR(30),
    IN p_FirstName VARCHAR(30),
    IN p_LastName VARCHAR(30),
    IN p_Email VARCHAR(50)
)
BEGIN
    DECLARE v_NewUserID INT; -- Used to update CreatedBy after insertion
    
    -- == Critical validation errors ==

    -- Checking for duplicate email before INSERT based on the UNIQUE constraint from users table
    IF EXISTS (
        SELECT 1 
        FROM users 
        WHERE Email = p_Email
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'A user with that email already exists.';
    END IF;

    -- Password minimum length check
    IF p_Password IS NULL OR LENGTH(p_Password) < 6 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Password must be at least 6 characters long.';
    END IF;

    -- ================================

    -- Create the user with default values for UserType (Student) and LoanPeriodDays (14)
    INSERT INTO users (
        Password,
        FirstName,
        LastName,
        Email,
        Balance,
        UserType,
        LoanPeriodDays,
        Status,
        CreatedBy, -- Will be populated with the newly registered user's ID after insertion
        UpdatedBy
    ) VALUES (
        p_Password,
        p_FirstName,
        p_LastName,
        p_Email,
        0.00, -- Default balance
        0, -- Default to Student user type for self-registration
        14, -- Default loan period for students
        1, -- Active status
        NULL,
        NULL
    );

-- Get newly generated UserID
    SET v_NewUserID = LAST_INSERT_ID(); 

-- Update CreatedBy
    UPDATE users
    SET CreatedBy = v_NewUserID,
        UpdatedBy = v_NewUserID
    WHERE UserID = v_NewUserID;
END$$

DELIMITER ;