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
        SET MESSAGE_TEXT = 'Cannot pay fines for active loans';
    END IF;

    -- Mark all unpaid fines as paid
    UPDATE fines
    SET PaidStatus = 1,
        PaidAt = CURRENT_TIMESTAMP(),
        UpdatedAt = CURRENT_TIMESTAMP(),
        UpdatedBy = p_UserID
    WHERE UserID = p_UserID
      AND PaidStatus = 0;

    COMMIT;
END$$

-- =================================================================================================================
--                                               LOAN & HOLD QUERIES
-- =================================================================================================================

-- =========================================================
-- Procedure: Checkout an item for a specific user
-- =========================================================
DROP PROCEDURE IF EXISTS CheckoutItem$$
CREATE PROCEDURE CheckoutItem (
    IN p_UserID INT,
    IN p_ItemID BIGINT
)
BEGIN
    DECLARE v_CopyID INT DEFAULT NULL;
    DECLARE v_DueDays INT DEFAULT NULL;

    START TRANSACTION;

    -- Get the user's loan period and lock the row during checkout
    SELECT u.LoanPeriodDays
    INTO v_DueDays
    FROM users AS u
    WHERE u.UserID = p_UserID
    FOR UPDATE;

    IF v_DueDays IS NULL THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Invalid user';
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
        DueDate
    )
    VALUES (
        p_UserID,
        v_CopyID,
        p_UserID, -- Super User
        CURDATE(),
        CURDATE(),
        DATE_ADD(CURDATE(), INTERVAL v_DueDays DAY)
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
    DECLARE v_UserBalance DECIMAL(7,2) DEFAULT 0.00;
    DECLARE v_AvailableCopies INT DEFAULT 0;
    DECLARE v_ExistingHold INT DEFAULT 0;

    -- Check if the user exists and has an active status
    SELECT Status
    INTO v_UserStatus
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


DELIMITER ;