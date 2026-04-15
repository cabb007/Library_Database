DELIMITER $$

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
        c.UpdatedAt = NOW(),
        c.UpdatedBy = p_UserID
    WHERE c.CopyID = v_CopyID;

    -- Create the loan record using the user's loan period
    INSERT INTO loans (
        UserID,
        CopyID,
        CreatedBy,
        CreatedAt,
        DueDate
    )
    VALUES (
        p_UserID,
        v_CopyID,
        1, -- Super User
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
    DECLARE v_UserBalance DECIMAL(7,2) DEFAULT NULL;
    DECLARE v_AvailableCopies INT DEFAULT 0;
    DECLARE v_ExistingHold INT DEFAULT 0;

    -- Check if the user exists and has an active status
    SELECT Status, Balance
    INTO v_UserStatus, v_UserBalance
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

    IF v_UserBalance > 0 THEN -- I'm not sure if this is a rule we made yet, but it makes sense to prevent users with outstanding fines from placing holds (Mikkel)
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Users with unpaid balances cannot place holds';
    END IF;

    -- Check that the item exists
    IF NOT EXISTS (
        SELECT 1 
        FROM items 
        WHERE ITEMID = p_ItemID
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
    VALUES ( -- This needs some work to set the CreatedBy/UpdatedBy fields, but we can discuss how to do that since holds don't have those columns (Mikkel)
        p_UserID,
        p_ItemID,
        0, -- Active hold
        NOW(),
        p_UserID,
        NOW(),
        p_UserID
    );

END$$


DELIMITER ;