DELIMITER $$

-- Library Database Stored Procedures - Media, Devices, Literature
-- =========================================================

-- =========================================================
-- Procedure: Get all media items
-- =========================================================
DROP PROCEDURE IF EXISTS GetMediaItems$$
CREATE PROCEDURE GetMediaItems()
BEGIN
    SELECT 
        i.ItemID,
        i.Title,
        m.Producer,
        m.DurationMinutes
    FROM items i
    JOIN media m ON i.ItemID = m.ItemID
    WHERE i.ItemCategory = 2;
END$$

-- =========================================================
-- Procedure: Get all devices
-- =========================================================
DROP PROCEDURE IF EXISTS GetDevices$$
CREATE PROCEDURE GetDevices()
BEGIN
    SELECT 
        i.ItemID,
        i.Title,
        d.Manufacturer,
        d.Model
    FROM items i
    JOIN devices d ON i.ItemID = d.ItemID
    WHERE i.ItemCategory = 3;
END$$

-- =========================================================
-- Procedure: Get all literature items (books, etc.)
-- =========================================================
DROP PROCEDURE IF EXISTS GetLiterature$$
CREATE PROCEDURE GetLiterature()
BEGIN
    SELECT 
        i.ItemID,
        i.Title,
        l.Author,
        l.Publisher,
        l.PublicationYear
    FROM items i
    JOIN literature l ON i.ItemID = l.ItemID
    WHERE i.ItemCategory = 1;
END$$



-- =========================================================
-- Procedure: Get number of available copies
-- =========================================================
CREATE PROCEDURE GetAvailableCopies(IN p_ItemID BIGINT)
BEGIN
    SELECT COUNT(*) AS AvailableCopies
    FROM copies
    WHERE ItemID = p_ItemID
      AND CopyStatus = 1;
END $$

DELIMITER ;