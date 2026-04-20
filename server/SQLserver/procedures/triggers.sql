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
    DECLARE v_UnpaidBalance DECIMAL(7,2) DEFAULT 0.00;
    DECLARE v_LoanPeriodDays INT;
    DECLARE v_UserType INT;
    DECLARE v_CurrentLoans INT DEFAULT 0;
    DECLARE v_MaxLoans INT DEFAULT 0;
    DECLARE v_ItemTitle VARCHAR(255) DEFAULT NULL;
    DECLARE v_ItemTypeLabel VARCHAR(50) DEFAULT NULL;

    -- Only run when a copy becomes Available (CopyStatus changes from 1 to 0)
    IF OLD.CopyStatus = 1 AND NEW.CopyStatus = 0 THEN
        
        -- Find the earliest Active hold for this item (FIFO ordering by CreatedAt)
        SELECT h.HoldID, h.UserID
        INTO v_HoldID, v_HoldUserID
        FROM holds AS h
        WHERE h.ItemID = NEW.ItemID
          AND h.HoldStatus = 0 -- HoldStatus: 0=Active, 1=Fulfilled, 2=Cancelled
        ORDER BY h.CreatedAt
        LIMIT 1;

        -- Only continue if a hold exists for this item
        IF v_HoldID IS NOT NULL THEN

            SELECT u.Status, u.LoanPeriodDays, u.UserType
            INTO v_UserStatus, v_LoanPeriodDays, v_UserType
            FROM users AS u
            WHERE u.UserID = v_HoldUserID;

            SET v_UnpaidBalance = GetUserBalanceValue(v_HoldUserID);

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
               AND v_UnpaidBalance <= 0
               AND v_CurrentLoans < v_MaxLoans THEN

                -- Mark hold as fulfilled
                UPDATE holds
                SET HoldStatus = 1,
                    UpdatedAt = CURRENT_TIMESTAMP(),
                    UpdatedBy = 1 -- Super UserID = 1 for system actions
                WHERE HoldID = v_HoldID;

                -- Create a new loan for this copy
                INSERT INTO loans (
                    UserID,
                    CopyID,
                    DueDate,
                    CreatedAt,
                    CreatedBy,
                    UpdatedAt,
                    UpdatedBy
                ) VALUES (
                    v_HoldUserID,
                    NEW.CopyID,
                    DATE_ADD(CURRENT_TIMESTAMP(), INTERVAL v_LoanPeriodDays DAY),
                    CURRENT_TIMESTAMP(),
                    v_HoldUserID,
                    CURRENT_TIMESTAMP(),
                    NULL
                );


                -- Get item title and determine type via subtype tables
                SELECT 
                    i.Title,
                    CASE
                        WHEN l.ItemID IS NOT NULL THEN 'Literature'
                        WHEN m.ItemID IS NOT NULL THEN 'Media'
                        WHEN d.ItemID IS NOT NULL THEN 'Device'
                        ELSE 'Item'
                    END
                INTO v_ItemTitle, v_ItemTypeLabel
                FROM items i
                LEFT JOIN literature l ON i.ItemID = l.ItemID
                LEFT JOIN media m ON i.ItemID = m.ItemID
                LEFT JOIN devices d ON i.ItemID = d.ItemID
                WHERE i.ItemID = NEW.ItemID;

                -- Send notification to the user whose hold was fulfilled
                INSERT INTO notifications (
                    UserID,
                    Header,
                    Body,
                    IsRead,
                    CreatedAt,
                    CreatedBy,
                    UpdatedAt,
                    UpdatedBy
                )
                VALUES (
                    v_HoldUserID,
                    'Hold Fulfilled',
                    CONCAT(
                        'Your hold for ',
                        v_ItemTypeLabel,
                        ': "',
                        v_ItemTitle,
                        '" has been fulfilled.'
                    ),
                    0,
                    CURRENT_TIMESTAMP(),
                    1,
                    CURRENT_TIMESTAMP(),
                    NULL
                );            
            END IF;
        END IF;
    END IF;
END$$

-- =========================================================
-- Trigger: Return Integrity / Notification Trigger
-- =========================================================
DROP TRIGGER IF EXISTS ReturnIntegrityNotificationTrigger$$
CREATE TRIGGER ReturnIntegrityNotificationTrigger
AFTER UPDATE ON loans
FOR EACH ROW
BEGIN
    DECLARE v_UpdatedByType INT DEFAULT NULL;
    DECLARE v_CopyStatus INT DEFAULT NULL;
    DECLARE v_ActiveLoanCount INT DEFAULT 0;
    DECLARE v_Balance DECIMAL(7,2) DEFAULT 0.00;

    -- Only run when a loan changes from active to returned
    IF OLD.ReturnDate IS NULL AND NEW.ReturnDate IS NOT NULL THEN

        -- Processor must exist and be a librarian
        SELECT UserType
        INTO v_UpdatedByType
        FROM users
        WHERE UserID = NEW.UpdatedBy;

        IF v_UpdatedByType IS NULL THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Invalid UpdatedBy user on return.';
        END IF;

        IF v_UpdatedByType <> 2 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Only librarians may process returns.';
        END IF;

        -- Associated copy must still be OnLoan at this moment
        SELECT CopyStatus
        INTO v_CopyStatus
        FROM copies
        WHERE CopyID = NEW.CopyID;

        IF v_CopyStatus IS NULL THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Associated copy does not exist.';
        END IF;

        IF v_CopyStatus <> 1 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Return invalid: copy is not currently OnLoan.';
        END IF;

        -- Ensure no duplicate active loans for this copy
        SELECT COUNT(*)
        INTO v_ActiveLoanCount
        FROM loans
        WHERE CopyID = NEW.CopyID
          AND ReturnDate IS NULL;

        IF v_ActiveLoanCount <> 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Return invalid: copy still has another active loan.';
        END IF;

        --  Chronological validation (date-level only to avoid timestamp precision/timezone issues)
        IF DATE(NEW.ReturnDate) < DATE(NEW.CreatedAt) THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'ReturnDate cannot be earlier than CreatedAt.';
        END IF;

        IF NEW.ReturnDate > CURRENT_TIMESTAMP() THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'ReturnDate cannot be in the future.';
        END IF;

        -- Check borrower balance using existing function
        SET v_Balance = GetUserBalanceValue(NEW.UserID);

        --  Notify borrower if unpaid balance exists
        IF v_Balance > 0 THEN
            INSERT INTO notifications (
                UserID,
                Header,
                Body,
                IsRead,
                CreatedAt,
                CreatedBy,
                UpdatedAt,
                UpdatedBy
            ) VALUES (
                NEW.UserID,
                'Outstanding Fine Balance',
                CONCAT(
                    'Your item has been successfully returned. ',
                    'However, your current unpaid fine balance is $',
                    FORMAT(v_Balance, 2),
                    '. All fines must be paid in full before new checkouts or holds can proceed.'
                ),
                0,
                CURRENT_TIMESTAMP(),
                1, -- System admin
                CURRENT_TIMESTAMP(),
                NULL
            );
        END IF;
    END IF;
END$$


-- =========================================================
-- Trigger: Fine Insert Notification Trigger
-- =========================================================
DROP TRIGGER IF EXISTS FinesInsertTrigger$$
CREATE TRIGGER FinesInsertTrigger
AFTER INSERT ON fines
FOR EACH ROW
BEGIN
    DECLARE v_CurrentBalance DECIMAL(7,2) DEFAULT 0.00;

    SET v_CurrentBalance = GetUserBalanceValue(NEW.UserID);

    INSERT INTO notifications (
        UserID,
        Header,
        Body,
        IsRead,
        CreatedAt,
        CreatedBy,
        UpdatedAt,
        UpdatedBy
    )
    VALUES (
        NEW.UserID,
        'A fine was issued to your account.',
        'Please clear your balance before attempting new checkouts or holds.',
        0,
        CURRENT_TIMESTAMP(),
        1,
        CURRENT_TIMESTAMP(),
        NULL
    );
END$$

-- =========================================================
-- Trigger: Fine Update Notification Trigger
-- =========================================================
DROP TRIGGER IF EXISTS FinesUpdateTrigger$$
CREATE TRIGGER FinesUpdateTrigger
AFTER UPDATE ON fines
FOR EACH ROW
BEGIN
    DECLARE v_CurrentBalance DECIMAL(7,2) DEFAULT 0.00;

    IF OLD.FineAmount <> NEW.FineAmount
       OR OLD.PaidStatus <> NEW.PaidStatus THEN

        SET v_CurrentBalance = GetUserBalanceValue(NEW.UserID);

        INSERT INTO notifications (
            UserID,
            Header,
            Body,
            IsRead,
            CreatedAt,
            CreatedBy,
            UpdatedAt,
            UpdatedBy
        )
        VALUES (
            NEW.UserID,
            CASE
                WHEN NEW.PaidStatus = 1 AND v_CurrentBalance = 0 THEN 'Your fines have been paid.'
                WHEN NEW.PaidStatus = 1 THEN 'Your balance has been updated.'
                ELSE 'Your balance has been updated.'
            END,
            CASE
                WHEN v_CurrentBalance = 0 THEN
                    'Your outstanding fine balance is now $0.00. All fines on your account are fully cleared.'
                ELSE
                    CONCAT(
                        'Your current total outstanding fine balance is $',
                        FORMAT(v_CurrentBalance, 2),
                        '. Please clear your balance before attempting new checkouts or holds.'
                    )
            END,
            0,
            CURRENT_TIMESTAMP(),
            1,
            CURRENT_TIMESTAMP(),
            NULL
        );
    END IF;
END$$

DELIMITER ;