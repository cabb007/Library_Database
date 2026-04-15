DELIMITER $$

-- =================================================================================================================
--                                               TRIGGERS
-- =================================================================================================================

-- =========================================================
-- Trigger: Hold Fulfillment Trigger
-- =========================================================
DROP TRIGGER IF EXISTS HoldFulfillmentTrigger$$
CREATE TRIGGER HoldFulfillmentTrigger
AFTER UPDATE ON copies
FOR EACH ROW
BEGIN
    DECLARE v_HoldID INT DEFAULT NULL;
    DECLARE v_HoldUserID INT DEFAULT NULL;
    DECLARE v_UserStatus INT;
    DECLARE v_UserBalance DECIMAL(7,2);
    DECLARE v_LoanPeriodDays INT;
    DECLARE v_UserType INT;
    DECLARE v_CurrentLoans INT DEFAULT 0;
    DECLARE v_MaxLoans INT DEFAULT 0;

    -- Only run when a copy becomes Available (CopyStatus changes from 1 to 0)
    IF OLD.CopyStatus = 1 AND NEW.CopyStatus = 0 THEN
        
        -- Find the earliest Active hold for this item (FIFO ordering by RequestDate)
        SELECT h.HoldID, h.UserID
        INTO v_HoldID, v_HoldUserID
        FROM holds AS h
        WHERE h.ItemID = NEW.ItemID
          AND h.HoldStatus = 0 -- HoldStatus: 0=Active, 1=Fulfilled, 2=Cancelled
        ORDER BY h.RequestDate
        LIMIT 1;

        -- Only continue if a hold exists for this item
        IF v_HoldID IS NOT NULL THEN

            SELECT u.Status, u.Balance, u.LoanPeriodDays, u.UserType
            INTO v_UserStatus, v_UserBalance, v_LoanPeriodDays, v_UserType
            FROM users AS u
            WHERE u.UserID = v_HoldUserID;

            -- Determine max allowed loans
            IF v_UserType = 0 THEN
                SET v_MaxLoans = 3; -- Student
            ELSE
                SET v_MaxLoans = 5; -- Librarian and Faculty
            END IF;

            -- Count user's current active loans
            SELECT COUNT(*)
            INTO v_CurrentLoans
            FROM loans
            WHERE UserID = v_HoldUserID
              AND ReturnDate IS NULL;

            -- Check eligibility (active status, no unpaid balance, under loan limit)
            IF v_UserStatus = 1
               AND v_UserBalance <= 0
               AND v_CurrentLoans < v_MaxLoans THEN

                -- Mark hold as fulfilled
                UPDATE holds
                SET HoldStatus = 1 -- 1=Fulfilled
                WHERE HoldID = v_HoldID;

                -- Create a new loan for this copy
                INSERT INTO loans (
                    UserID,
                    CopyID,
                    CreatedBy,
                    CheckoutDate,
                    DueDate
                ) VALUES (
                    v_HoldUserID,
                    NEW.CopyID,
                    v_HoldUserID, -- CreatedBy is the user who is fulfilling the hold
                    CURDATE(),
                    DATE_ADD(CURDATE(), INTERVAL v_LoanPeriodDays DAY)
                );

            END IF;
        END IF;
    END IF;
END$$

-- =========================================================
-- Trigger: EnforceBorrowingLimitTrigger
-- Only checks borrower eligibility when attempting to loan/checkout an item
-- =========================================================
DROP TRIGGER IF EXISTS EnforceBorrowingLimitTrigger$$
CREATE TRIGGER EnforceBorrowingLimitTrigger
BEFORE INSERT ON loans
FOR EACH ROW
BEGIN
    DECLARE v_UserStatus INT DEFAULT NULL;
    DECLARE v_UserBalance DECIMAL(7,2) DEFAULT NULL;
    DECLARE v_UserType INT DEFAULT NULL;
    DECLARE v_MaxLoans INT DEFAULT 0;
    DECLARE v_CurrentLoans INT DEFAULT 0;
    
    -- Get user status, balance, and type
    SELECT u.Status, u.Balance, u.UserType
    INTO v_UserStatus, v_UserBalance, v_UserType
    FROM users AS u
    WHERE u.UserID = NEW.UserID;

    -- Make sure the user exists
    IF v_UserStatus IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'User does not exist.';
    END IF;

    -- Set max loans based on user type
    IF v_UserType = 0 THEN
        SET v_MaxLoans = 3;  -- Student
    ELSEIF v_UserType IN (1, 2) THEN
        SET v_MaxLoans = 5;  -- Librarian and Faculty
    ELSE
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Invalid user type.';
    END IF;

    -- Count current active loans
    SELECT COUNT(*)
    INTO v_CurrentLoans
    FROM loans AS l
    WHERE l.UserID = NEW.UserID
      AND l.ReturnDate IS NULL;

    -- User must be active
    IF v_UserStatus <> 1 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'User is not active.';
    END IF;

    -- User must have no unpaid balance
    IF v_UserBalance <> 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'User has an unpaid balance.';
    END IF;

    -- User must be under borrowing limit
    IF v_CurrentLoans >= v_MaxLoans THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Borrowing limit exceeded for this user.';
    END IF;
END$$

DELIMITER ;