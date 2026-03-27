DELIMITER $$

-- =========================================================
-- Library Database Stored Procedures - Media, Devices, Literature
-- =========================================================

CREATE FUNCTION GetAvailableCopies(p_ItemID BIGINT)
RETURNS INT
DETERMINISTIC
BEGIN
    DECLARE available INT;

    SELECT COUNT(*) INTO available
    FROM copies
    WHERE ItemID = p_ItemID
      AND CopyStatus = 1;

    RETURN available;
END $$

-- =========================================================
-- Procedure: Get all media items
-- =========================================================
DROP PROCEDURE IF EXISTS GetMedia$$
CREATE PROCEDURE GetMedia()
BEGIN
    SELECT 
        i.ItemID,
        i.Title,
        m.Producer,
        m.DurationMinutes,
        GetAvailableCopies(i.ItemID) AS AvailableCopies
    FROM items i
    JOIN media m ON i.ItemID = m.ItemID
    WHERE i.ItemCategory = 2;
END$$

-- =========================================================
-- Procedure: Get all devices data
-- =========================================================
DROP PROCEDURE IF EXISTS GetDevices$$
CREATE PROCEDURE GetDevices()
BEGIN
    SELECT 
        i.ItemID,
        i.Title,
        d.Manufacturer,
        d.Model,
        GetAvailableCopies(i.ItemID) AS AvailableCopies
    FROM items i
    JOIN devices d ON i.ItemID = d.ItemID
    WHERE i.ItemCategory = 3;
END$$

-- =========================================================
-- Procedure: Get all literature data
-- =========================================================
DROP PROCEDURE IF EXISTS GetLiterature$$
CREATE PROCEDURE GetLiterature()
BEGIN
    SELECT 
        i.ItemID,
        i.Title,
        l.Author,
        l.Publisher,
        l.PublicationYear,
        GetAvailableCopies(i.ItemID) AS AvailableCopies
    FROM items i
    JOIN literature l ON i.ItemID = l.ItemID
    WHERE i.ItemCategory = 1;
END$$

-- =========================================================
-- NEW: Procedure to get title for selected item
-- =========================================================
DROP PROCEDURE IF EXISTS getTitle$$
CREATE PROCEDURE getTitle(IN p_ItemID BIGINT)
BEGIN
    SELECT 
        Title As Title
    FROM items
    WHERE ItemID = p_ItemID;
END$$

DELIMITER ;