SET FOREIGN_KEY_CHECKS = 0;

-- =========================
-- USERS
-- =========================
LOAD DATA LOCAL INFILE 'data/users.csv'
INTO TABLE users
FIELDS TERMINATED BY ','
OPTIONALLY ENCLOSED BY '"'
IGNORE 1 ROWS
(Password, FirstName, LastName, Email, Balance, UserType, LoanPeriodDays, Status, CreatedAt, @cb, UpdatedAt, @ub)
SET
    CreatedBy = NULLIF(TRIM(@cb), ''),
    UpdatedBy = NULLIF(TRIM(@ub), '');

SHOW WARNINGS LIMIT 50;
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM items;
SELECT COUNT(*) FROM literature;
SELECT COUNT(*) FROM media;
SELECT COUNT(*) FROM devices;
SELECT COUNT(*) FROM copies;

-- =========================
-- ITEMS
-- =========================
LOAD DATA LOCAL INFILE 'data/items.csv'
INTO TABLE items
FIELDS TERMINATED BY ','
OPTIONALLY ENCLOSED BY '"'
IGNORE 1 ROWS
(ItemID, ItemCategory, Title, CreatedAt, @cb, UpdatedAt, @ub)
SET
    CreatedBy = NULLIF(TRIM(@cb), ''),
    UpdatedBy = NULLIF(TRIM(@ub), '');

SHOW WARNINGS LIMIT 50;
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM items;
SELECT COUNT(*) FROM literature;
SELECT COUNT(*) FROM media;
SELECT COUNT(*) FROM devices;
SELECT COUNT(*) FROM copies;

-- =========================
-- LITERATURE
-- =========================
LOAD DATA LOCAL INFILE 'data/literature.csv'
INTO TABLE literature
FIELDS TERMINATED BY ','
OPTIONALLY ENCLOSED BY '"'
IGNORE 1 ROWS;

SHOW WARNINGS LIMIT 50;
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM items;
SELECT COUNT(*) FROM literature;
SELECT COUNT(*) FROM media;
SELECT COUNT(*) FROM devices;
SELECT COUNT(*) FROM copies;
-- =========================
-- MEDIA
-- =========================
LOAD DATA LOCAL INFILE 'data/media.csv'
INTO TABLE media
FIELDS TERMINATED BY ','
OPTIONALLY ENCLOSED BY '"'
IGNORE 1 ROWS;

SHOW WARNINGS LIMIT 50;
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM items;
SELECT COUNT(*) FROM literature;
SELECT COUNT(*) FROM media;
SELECT COUNT(*) FROM devices;
SELECT COUNT(*) FROM copies;
-- =========================
-- DEVICES
-- =========================
LOAD DATA LOCAL INFILE 'data/devices.csv'
INTO TABLE devices
FIELDS TERMINATED BY ','
OPTIONALLY ENCLOSED BY '"'
IGNORE 1 ROWS;

SHOW WARNINGS LIMIT 50;
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM items;
SELECT COUNT(*) FROM literature;
SELECT COUNT(*) FROM media;
SELECT COUNT(*) FROM devices;
SELECT COUNT(*) FROM copies;
-- =========================
-- COPIES
-- =========================
LOAD DATA LOCAL INFILE 'data/copies.csv'
INTO TABLE copies
FIELDS TERMINATED BY ','
OPTIONALLY ENCLOSED BY '"'
IGNORE 1 ROWS
(ItemID, CopyStatus, CreatedAt, @cb, UpdatedAt, @ub)
SET
    CreatedBy = NULLIF(TRIM(@cb), ''),
    UpdatedBy = NULLIF(TRIM(@ub), '');

SHOW WARNINGS LIMIT 50;
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM items;
SELECT COUNT(*) FROM literature;
SELECT COUNT(*) FROM media;
SELECT COUNT(*) FROM devices;
SELECT COUNT(*) FROM copies;
-- =========================
-- HOLDS
-- =========================
LOAD DATA LOCAL INFILE 'data/holds.csv'
INTO TABLE holds
FIELDS TERMINATED BY ','
OPTIONALLY ENCLOSED BY '"'
IGNORE 1 ROWS;

SHOW WARNINGS LIMIT 50;
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM items;
SELECT COUNT(*) FROM literature;
SELECT COUNT(*) FROM media;
SELECT COUNT(*) FROM devices;
SELECT COUNT(*) FROM copies;


-- =========================
-- LOANS
-- =========================
LOAD DATA LOCAL INFILE 'data/loans.csv'
INTO TABLE loans
FIELDS TERMINATED BY ','
OPTIONALLY ENCLOSED BY '"'
IGNORE 1 ROWS;

SHOW WARNINGS LIMIT 50;
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM items;
SELECT COUNT(*) FROM literature;
SELECT COUNT(*) FROM media;
SELECT COUNT(*) FROM devices;
SELECT COUNT(*) FROM copies;
-- =========================
-- FINES
-- =========================
LOAD DATA LOCAL INFILE 'data/fines.csv'
INTO TABLE fines
FIELDS TERMINATED BY ','
OPTIONALLY ENCLOSED BY '"'
IGNORE 1 ROWS;

SHOW WARNINGS LIMIT 50;
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM items;
SELECT COUNT(*) FROM literature;
SELECT COUNT(*) FROM media;
SELECT COUNT(*) FROM devices;
SELECT COUNT(*) FROM copies;
SET FOREIGN_KEY_CHECKS = 1;
