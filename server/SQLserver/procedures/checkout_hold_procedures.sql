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
        CheckoutDate,
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

DELIMITER ;