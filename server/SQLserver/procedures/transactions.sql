DELIMITER $$

-- =================================================================================================================
--                                               PAYMENT QUERIES
-- =================================================================================================================

-- =========================================================
-- Procedure: Initialize fine amounts after database load, creates missing fine rows for overdue active loans, then updates all unpaid overdue fine amounts
-- =========================================================
DROP PROCEDURE IF EXISTS InitializeFineAmounts$$
CREATE PROCEDURE InitializeFineAmounts()
BEGIN
    -- Create missing fine rows for overdue loans
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
        CURRENT_TIMESTAMP(),
        1, 
        CURRENT_TIMESTAMP(),
        1 -- SysAdmin UserID = 1
    FROM loans l
    LEFT JOIN fines f ON f.LoanID = l.LoanID
    WHERE f.FineID IS NULL
      AND l.DueDate < CURDATE();

    -- Update all existing unpaid fines
    UPDATE fines f
    JOIN loans l ON f.LoanID = l.LoanID
    SET f.FineAmount = GREATEST(DATEDIFF(COALESCE(l.ReturnDate, CURDATE()), l.DueDate), 0) * 2.00,
        f.UpdatedAt = CURRENT_TIMESTAMP(),
        f.UpdatedBy = 1 -- SysAdmin UserID = 1
    WHERE f.PaidStatus = 0
      AND l.DueDate < CURDATE();
END$$

-- =========================================================
-- Prodcedure: Pay a specific fine for a user
-- =========================================================
DROP PROCEDURE IF EXISTS PayFine$$

CREATE PROCEDURE PayFine (
    IN p_UserID INT
)
BEGIN
    DECLARE v_UnpaidFineCount INT DEFAULT 0;
    DECLARE v_ActiveLoanFineCount INT DEFAULT 0;

    START TRANSACTION;

    -- Check if the user has any unpaid fines
    SELECT COUNT(*)
    INTO v_UnpaidFineCount
    FROM fines
    WHERE UserID = p_UserID
      AND PaidStatus = 0;

    IF v_UnpaidFineCount = 0 THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'No unpaid fines found for this user';
    END IF;

    -- Check whether any unpaid fine is tied to an active loan
    SELECT COUNT(*)
    INTO v_ActiveLoanFineCount
    FROM fines f
    JOIN loans l ON f.LoanID = l.LoanID
    WHERE f.UserID = p_UserID
      AND f.PaidStatus = 0
      AND l.ReturnDate IS NULL;

    IF v_ActiveLoanFineCount > 0 THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot pay fines when loans are active';
    END IF;

    -- Mark all unpaid fines as paid
    UPDATE fines
    SET PaidStatus = 1,
        PaidAt = CURRENT_TIMESTAMP(),
        UpdatedAt = CURRENT_TIMESTAMP(),
        UpdatedBy = p_UserID
    WHERE UserID = p_UserID
      AND PaidStatus = 0;

    UPDATE users
        SET Status = 1
    WHERE UserID = p_UserID;

    COMMIT;
END$$

-- =================================================================================================================
--                                               LOAN & HOLD QUERIES
-- =================================================================================================================

-- =========================================================
-- Procedure: Checkout an item for a specific user
-- =========================================================
-- =========================================================
DROP PROCEDURE IF EXISTS CheckoutItem$$
CREATE PROCEDURE CheckoutItem (
    IN p_UserID INT,
    IN p_ItemID BIGINT
)
BEGIN
    DECLARE v_CopyID INT DEFAULT NULL;
    DECLARE v_DueDays INT DEFAULT NULL;
    DECLARE v_UserStatus INT DEFAULT NULL;
    DECLARE v_UserType INT DEFAULT NULL;
    DECLARE v_UnpaidBalance DECIMAL(7,2) DEFAULT 0.00;
    DECLARE v_MaxLoans INT DEFAULT 0;
    DECLARE v_CurrentLoans INT DEFAULT 0;
    DECLARE v_ExistingItemLoan INT DEFAULT 0;

    START TRANSACTION;

    -- Get the user's loan period, status, and type; lock the row during checkout
    SELECT u.LoanPeriodDays, u.Status, u.UserType
    INTO v_DueDays, v_UserStatus, v_UserType
    FROM users AS u
    WHERE u.UserID = p_UserID
    FOR UPDATE;

    IF v_DueDays IS NULL THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Invalid user';
    END IF;

    IF v_UserStatus <> 1 THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'User is not active.';
    END IF;

    SET v_UnpaidBalance = GetUserBalanceValue(p_UserID);
    IF v_UnpaidBalance <> 0 THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'User has an unpaid balance.';
    END IF;

    IF v_UserType = 0 THEN
        SET v_MaxLoans = 3;
    ELSE
        SET v_MaxLoans = 5;
    END IF;

    SELECT COUNT(*) INTO v_CurrentLoans
    FROM loans WHERE UserID = p_UserID AND ReturnDate IS NULL;

    IF v_CurrentLoans >= v_MaxLoans THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Borrowing limit exceeded for this user.';
    END IF;

    SELECT COUNT(*)
    INTO v_ExistingItemLoan
    FROM loans AS l
    JOIN copies AS c ON l.CopyID = c.CopyID
    WHERE l.UserID = p_UserID
      AND l.ReturnDate IS NULL
      AND c.ItemID = p_ItemID;

    IF v_ExistingItemLoan > 0 THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'User already has an active loan for this item.';
    END IF;

    -- Find the first available copy for the selected item
    SELECT c.CopyID
    INTO v_CopyID
    FROM copies AS c
    WHERE c.ItemID = p_ItemID
      AND c.CopyStatus = 0
    ORDER BY c.CopyID
    LIMIT 1
    FOR UPDATE;

    -- Stop if no copies are available
    IF v_CopyID IS NULL THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'No available copy';
    END IF;

    -- Mark the copy as checked out; note CopyStatus: 0=Available,1=OnLoan
    UPDATE copies AS c
    SET c.CopyStatus = 1,
        c.UpdatedAt = CURRENT_TIMESTAMP(),
        c.UpdatedBy = p_UserID
    WHERE c.CopyID = v_CopyID;

    -- Create the loan record using the user's loan period
    INSERT INTO loans (
        UserID,
        CopyID,
        CreatedBy,
        CreatedAt,
        UpdatedAt,
        UpdatedBy,
        DueDate
    )
    VALUES (
        p_UserID,
        v_CopyID,
        p_UserID,
        CURRENT_TIMESTAMP(),
        CURRENT_TIMESTAMP(),
        p_UserID,
        DATE_ADD(CURRENT_TIMESTAMP(), INTERVAL v_DueDays DAY)
    );

    COMMIT;

END$$

-- =========================================================
-- Procedure: Create a new hold request for a specific user and item
-- =========================================================
DROP PROCEDURE IF EXISTS CreateHold$$
CREATE PROCEDURE CreateHold (
    IN p_UserID INT,
    IN p_ItemID BIGINT
)
BEGIN
    DECLARE v_UserStatus INT DEFAULT NULL;
    DECLARE v_UserType INT DEFAULT NULL;
    DECLARE v_UserBalance DECIMAL(7,2) DEFAULT 0.00;
    DECLARE v_AvailableCopies INT DEFAULT 0;
    DECLARE v_ExistingHold INT DEFAULT 0;
    DECLARE v_MaxHolds INT DEFAULT 0;
    DECLARE v_CurrentHolds INT DEFAULT 0;
    DECLARE v_ExistingItemLoan INT DEFAULT 0;

    -- Check if the user exists and has an active status
    SELECT Status, UserType
    INTO v_UserStatus, v_UserType
    FROM users
    WHERE UserID = p_UserID;

    IF v_UserStatus IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Invalid user';
    END IF;

    IF v_UserStatus <> 1 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'User is not active';
    END IF;

    -- Determine max allowed holds
    IF v_UserType = 0 THEN
        SET v_MaxHolds = 3; -- Student
    ELSE
        SET v_MaxHolds = 5; -- Librarian and Faculty
    END IF;

    -- Count user's current active holds
    SELECT COUNT(*)
    INTO v_CurrentHolds
    FROM holds
    WHERE UserID = p_UserID
      AND HoldStatus = 0;

    IF v_CurrentHolds >= v_MaxHolds THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Hold limit exceeded for this user';
    END IF;

    -- Check for unpaid balances
    SET v_UserBalance = GetUserBalanceValue(p_UserID);
    IF v_UserBalance > 0 THEN 
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Users with unpaid balances cannot place holds';
    END IF;

    -- Check that the item exists
    IF NOT EXISTS (
        SELECT 1 
        FROM items 
        WHERE ItemID = p_ItemID
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Invalid item';
    END IF;

    -- Prevent user from placing a hold if they already have an active loan for this item
    SELECT COUNT(*)
    INTO v_ExistingItemLoan
    FROM loans AS l
    JOIN copies AS c ON l.CopyID = c.CopyID
    WHERE l.UserID = p_UserID
      AND l.ReturnDate IS NULL
      AND c.ItemID = p_ItemID;

    IF v_ExistingItemLoan > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'User already has an active loan for this item';
    END IF;

    -- Only allow holds when no copies are currently available
    SELECT COUNT(*)
    INTO v_AvailableCopies
    FROM copies
    WHERE ItemID = p_ItemID
      AND CopyStatus = 0;

    IF v_AvailableCopies > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Copies are currently available; no need to place a hold';
    END IF;

    -- Prevent duplicate active hold for the same user and item
    SELECT COUNT(*)
    INTO v_ExistingHold
    FROM holds
    WHERE UserID = p_UserID
      AND ItemID = p_ItemID
      AND HoldStatus = 0; -- Active hold

    IF v_ExistingHold > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'User already has an active hold for this item';
    END IF;

    -- Create the hold request UserID,ItemID,HoldStatus,CreatedAt,CreatedBy,UpdatedAt,UpdatedBy
    INSERT INTO holds (
        UserID,
        ItemID,
        HoldStatus,
        CreatedAt,
        CreatedBy,
        UpdatedAt,
        UpdatedBy
    )
    VALUES (
        p_UserID,
        p_ItemID,
        0, -- Active hold
        CURRENT_TIMESTAMP(),
        p_UserID,
        CURRENT_TIMESTAMP(),
        p_UserID
    );

END$$

-- =================================================================================================================
--                                               ITEM RETURN QUERIES
-- =================================================================================================================

-- =========================================================
-- Procedure: Return a specific copy currently on loan
-- =========================================================
DROP PROCEDURE IF EXISTS ReturnLoan$$
CREATE PROCEDURE ReturnLoan(
    IN p_LoanID INT,
    IN p_UserID INT
)
BEGIN
    DECLARE v_CopyID INT DEFAULT NULL;
    DECLARE v_LoanUserID INT DEFAULT NULL;
    DECLARE v_ReturnDate DATETIME DEFAULT NULL;
    DECLARE v_ReturnUserType INT DEFAULT NULL;
    DECLARE v_AuditUserID INT DEFAULT 1;

    START TRANSACTION;

    SELECT CopyID, UserID, ReturnDate
    INTO v_CopyID, v_LoanUserID, v_ReturnDate
    FROM loans
    WHERE LoanID = p_LoanID
    FOR UPDATE;

    IF v_CopyID IS NULL THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Invalid loan';
    END IF;

    IF v_LoanUserID <> p_UserID THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'User cannot return this loan';
    END IF;

    IF v_ReturnDate IS NOT NULL THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Loan already returned';
    END IF;

    SELECT UserType
    INTO v_ReturnUserType
    FROM users
    WHERE UserID = p_UserID;

    IF v_ReturnUserType IS NULL THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Invalid returning user';
    END IF;

    IF v_ReturnUserType = 2 THEN
        SET v_AuditUserID = p_UserID;
    ELSE
        SET v_AuditUserID = 1;
    END IF;

    UPDATE loans
    SET ReturnDate = CURRENT_TIMESTAMP(),
        UpdatedAt = CURRENT_TIMESTAMP(),
        UpdatedBy = v_AuditUserID
    WHERE LoanID = p_LoanID;

    UPDATE copies
    SET CopyStatus = 0,
        UpdatedAt = CURRENT_TIMESTAMP(),
        UpdatedBy = v_AuditUserID
    WHERE CopyID = v_CopyID;

    COMMIT;
END$$

DELIMITER ;