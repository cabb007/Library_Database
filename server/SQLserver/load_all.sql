SET FOREIGN_KEY_CHECKS = 0;
-- =========================================================
--                          USERS
-- =========================================================
LOAD DATA LOCAL INFILE 'data/users.csv'
INTO TABLE users
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(Password, FirstName, LastName, Email, UserType, LoanPeriodDays, Status, CreatedAt, @cb, UpdatedAt, @ub)
SET
    CreatedBy = NULLIF(TRIM(REPLACE(@cb, '\r', '')), ''),
    UpdatedBy = NULLIF(TRIM(REPLACE(@ub, '\r', '')), '');

SHOW WARNINGS LIMIT 50;
SELECT COUNT(*) FROM users;

-- =========================================================
--                          ITEMS (supertype)
-- =========================================================
LOAD DATA LOCAL INFILE 'data/items.csv'
INTO TABLE items
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(ItemID, ItemCategory, Title, CreatedAt, @cb, UpdatedAt, @ub)
SET
    CreatedBy = NULLIF(TRIM(REPLACE(@cb, '\r', '')), ''),
    UpdatedBy = NULLIF(TRIM(REPLACE(@ub, '\r', '')), '');

SHOW WARNINGS LIMIT 50;
SELECT COUNT(*) FROM items;

-- =========================================================
--                          LITERATURE
-- =========================================================
LOAD DATA LOCAL INFILE 'data/literature.csv'
INTO TABLE literature
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(ItemID, ItemType, Author, Publisher, PublicationYear);

SHOW WARNINGS LIMIT 50;
SELECT COUNT(*) FROM literature;

-- =========================================================
--                          MEDIA
-- =========================================================
LOAD DATA LOCAL INFILE 'data/media.csv'
INTO TABLE media
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(ItemID, ItemType, Producer, DurationMinutes);

SHOW WARNINGS LIMIT 50;
SELECT COUNT(*) FROM media;

-- =========================================================
--                          DEVICES
-- =========================================================
LOAD DATA LOCAL INFILE 'data/devices.csv'
INTO TABLE devices
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(ItemID, ItemType, Manufacturer, Model);

SHOW WARNINGS LIMIT 50;
SELECT COUNT(*) FROM devices;


-- =========================================================
--                          COPIES
-- ========================================================
LOAD DATA LOCAL INFILE 'data/copies.csv'
INTO TABLE copies
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(ItemID, CopyStatus, CreatedAt, @cb, UpdatedAt, @ub)
SET
    CreatedBy = NULLIF(TRIM(REPLACE(@cb, '\r', '')), ''),
    UpdatedBy = NULLIF(TRIM(REPLACE(@ub, '\r', '')), '');
    
SHOW WARNINGS LIMIT 50;
SELECT COUNT(*) FROM copies;

-- =========================================================
--                          HOLDS
-- ========================================================
LOAD DATA LOCAL INFILE 'data/holds.csv'
INTO TABLE holds
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(UserID, ItemID, HoldStatus, CreatedAt, @cb, UpdatedAt, @ub)
SET
    CreatedBy = NULLIF(TRIM(REPLACE(@cb, '\r', '')), ''),
    UpdatedBy = NULLIF(TRIM(REPLACE(@ub, '\r', '')), '');

SHOW WARNINGS LIMIT 50;
SELECT COUNT(*) FROM holds;
-- =========================================================
--                          LOANS
-- ========================================================
LOAD DATA LOCAL INFILE 'data/loans.csv'
INTO TABLE loans
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(UserID, CopyID, @cb, @checkout_date, DueDate, @ret_date, CreatedAt, UpdatedAt, @ub)
SET
    CreatedBy  = NULLIF(TRIM(REPLACE(@cb,       '\r', '')), ''),
    ReturnDate = NULLIF(TRIM(REPLACE(@ret_date, '\r', '')), ''),
    UpdatedBy  = NULLIF(TRIM(REPLACE(@ub,       '\r', '')), '');

SHOW WARNINGS LIMIT 50;
SELECT COUNT(*) FROM loans;
-- =========================================================
--                          FINES
-- ========================================================
LOAD DATA LOCAL INFILE 'data/fines.csv'
INTO TABLE fines
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(LoanID, UserID, FineAmount, PaidStatus, PaidAt, CreatedAt, @cb, UpdatedAt, @ub)
SET
    CreatedBy = NULLIF(TRIM(REPLACE(@cb, '\r', '')), ''),
    UpdatedBy = NULLIF(TRIM(REPLACE(@ub, '\r', '')), '');

SHOW WARNINGS LIMIT 50;
SELECT COUNT(*) FROM fines;

CALL InitializeFineAmounts();

SET FOREIGN_KEY_CHECKS = 1;