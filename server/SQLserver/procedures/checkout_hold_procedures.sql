DELIMITER $$

CREATE PROCEDURE checkout_item (
    IN p_UserID INT,
    IN p_ItemID BIGINT
)
BEGIN
    DECLARE v_CopyID INT DEFAULT NULL;
    DECLARE v_DueDays INT DEFAULT NULL;

    START TRANSACTION;

    -- LOCK USER + GET LOAN PERIOD
    SELECT LoanPeriodDays
    INTO v_DueDays
    FROM users
    WHERE UserID = p_UserID
    FOR UPDATE;

    IF v_DueDays IS NULL THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Invalid user';
    END IF;

    -- FIND AVAILABLE COPY (status = 0 means available)
    SELECT CopyID
    INTO v_CopyID
    FROM copies
    WHERE ItemID = p_ItemID
      AND CopyStatus = 0
    ORDER BY CopyID
    LIMIT 1
    FOR UPDATE;

    IF v_CopyID IS NULL THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'No available copy';
    END IF;

    -- MARK AS CHECKED OUT (1)
    UPDATE copies
    SET CopyStatus = 1,
        UpdatedAt = NOW(),
        UpdatedBy = p_UserID
    WHERE CopyID = v_CopyID;

    -- CREATE LOAN RECORD
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