DROP DATABASE IF EXISTS library_db;
CREATE DATABASE library_db;
USE library_db;

SOURCE C:/Users/nequi/OneDrive/Documents/LibraryProject/SQLserver/schema.sql;
SOURCE C:/Users/nequi/OneDrive/Documents/LibraryProject/SQLserver/procedures/queries.sql;
SOURCE C:/Users/nequi/OneDrive/Documents/LibraryProject/SQLserver/procedures/triggers.sql;
SOURCE C:/Users/nequi/OneDrive/Documents/LibraryProject/SQLserver/procedures/checkout_hold_procedures.sql;

-- =========================================================
-- USERS
-- =========================================================
LOAD DATA LOCAL INFILE 'C:/Users/nequi/OneDrive/Documents/LibraryProject/SQLserver/data/users.csv'
INTO TABLE users
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(Password, FirstName, LastName, Email, Balance, UserType, LoanPeriodDays, Status, CreatedAt, @cb, UpdatedAt, @ub)
SET
    CreatedBy = NULLIF(@cb, ''),
    UpdatedBy = NULLIF(@ub, '');

-- =========================================================
-- ITEMS (supertype)
-- =========================================================
LOAD DATA LOCAL INFILE 'C:/Users/nequi/OneDrive/Documents/LibraryProject/SQLserver/data/items.csv'
INTO TABLE items
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(ItemID, ItemCategory, Title, CreatedAt, CreatedBy, UpdatedAt, UpdatedBy);

-- =========================================================
-- LITERATURE
-- =========================================================
LOAD DATA LOCAL INFILE 'C:/Users/nequi/OneDrive/Documents/LibraryProject/SQLserver/data/literature.csv'
INTO TABLE literature
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(ItemID, ItemType, Author, Publisher, PublicationYear);

-- =========================================================
-- MEDIA
-- =========================================================
LOAD DATA LOCAL INFILE 'C:/Users/nequi/OneDrive/Documents/LibraryProject/SQLserver/data/media.csv'
INTO TABLE media
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(ItemID, ItemType, Producer, DurationMinutes);

-- =========================================================
-- DEVICES
-- =========================================================
LOAD DATA LOCAL INFILE 'C:/Users/nequi/OneDrive/Documents/LibraryProject/SQLserver/data/devices.csv'
INTO TABLE devices
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(ItemID, ItemType, Manufacturer, Model);

-- =========================================================
-- COPIES
-- ========================================================
LOAD DATA LOCAL INFILE 'C:/Users/nequi/OneDrive/Documents/LibraryProject/SQLserver/data/copies.csv'
INTO TABLE copies
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(CopyID, ItemID, CopyStatus, CreatedAt, @cb, UpdatedAt, @ub)
SET
    CreatedBy = NULLIF(@cb, ''),
    UpdatedBy = NULLIF(@ub, '');


