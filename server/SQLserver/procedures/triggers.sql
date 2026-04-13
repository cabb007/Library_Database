DELIMITER $$

-- =================================================================================================================
--                                               TRIGGERS
-- =================================================================================================================

-- =========================================================
-- Trigger: Hold Fulfillment Trigger
-- =========================================================
DROP TRIGGER IF EXISTS HoldFulfillmentTrigger$$
CREATE TRIGGER HoldFulfillmentTrigger
AFTER UPDATE ON loans
FOR EACH ROW
BEGIN
    -- Declare variables to temporarily store values
    DECLARE holdID INT;
    DECLARE holdUserID INT;
    DECLARE userStatus INT;
    DECLARE userBalance DECIMAL(10, 2);
    DECLARE userType INT;
    DECLARE maxLoans INT;
    DECLARE currentLoans INT;

    -- Only run logic when a copy becomes available
    IF NEW.CopyStatus = 0 AND OLD.CopyStatus <> 1 THEN -- given copy changes from unavailable to available
    
        -- Find the earliest active hold for this item
        SELECT h.HoldID, h.UserID INTO holdID, holdUserID
        FROM holds AS h
        WHERE h.ItemID = NEW.ItemID
            AND h.HoldStatus = 1
        ORDER BY h.RequestDate
        LIMIT 1;
    
    -- If a hold exists, check that user's eligibility (no active loans, no overdue items)
        IF holdID IS NOT NULL THEN
        -- Get user status, balance, and max allowed loans
            SELECT u.Status, u.Balance, u.UserType INTO userStatus, userBalance, userType
            FROM users AS u
            WHERE u.UserID = holdUserID;
        
        -- Set max loans based on user type
        IF userType = 0 THEN
            SET maxLoans = 3;
        ELSEIF userType = 1 OR userType = 2 THEN
            SET maxLoans = 5;
        END IF;
        
        -- Count how many active loans the user currently has
        SELECT COUNT(*)
        INTO currentLoans
        FROM loans
        WHERE UserID = holdUserID
            AND ReturnDate IS NULL;    

        -- Check if user is eligible to borrow
            IF userStatus = 1 AND userBalance <= 0 AND currentLoans < maxLoans THEN
            -- Mark the hold as fulfilled
                UPDATE holds
                SET HoldStatus = 1 -- (0 = Active, 1 = Fulfilled, 2 = Cancelled)
                WHERE HoldID = holdID;
        -- Create a new loan for this available copy
            INSERT INTO loans(
                UserID,
                CopyID,
                CreatedBy,
                CheckoutDate,
                DueDate
                ) 
                VALUES (
                holdUserID,
                NEW.CopyID,
                1, -- Super User idea from Clay
                CURDATE(),
                DATE_ADD(
                    CURDATE(),
                    INTERVAL
                    CASE
                        WHEN u.UserType = 0 THEN 7 -- Students users get 7 days
                        WHEN u.UserType = 1 THEN 14 -- Faculty get 14 days
                        WHEN u.UserType = 2 THEN 14 -- Librarians get 14 days
                    END DAY
                )
            );
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
    DECLARE userStatus INT;
    DECLARE userBalance DECIMAL(7, 2);
    DECLARE maxLoans INT;
    DECLARE currentLoans INT;

    -- Get user status, balance, and type
    SELECT u.Status, u.Balance, u.UserType
    INTO userStatus, userBalance, userType
    FROM users AS u
    WHERE u.UserID = NEW.UserID;

    -- Set max loans based on user type
    IF userType = 0 THEN
        SET maxLoans = 3;  -- Student
    ELSEIF userType = 1 OR userType = 2 THEN
        SET maxLoans = 5;  -- Librarian and Faculty
    END IF;

    -- Count current active loans
    SELECT COUNT(*)
    INTO currentLoans
    FROM loans AS l
    WHERE l.UserID = NEW.UserID
      AND l.ReturnDate IS NULL;

    -- User must be active
    IF userStatus <> 1 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'User is not active.';
    END IF;

    -- User must have no unpaid balance
    IF userBalance <> 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'User has an unpaid balance.';
    END IF;

    -- Must be under borrowing limit
    IF currentLoans >= maxLoans THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Borrowing limit exceeded for this user.';
    END IF;
END$$

DELIMITER ;