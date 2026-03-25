-- =========================================================
-- Library Database Schema
-- All ItemIDs manual (ISBN/UPC/Serial), other IDs auto-increment
-- =========================================================

-- =========================================================
-- USERS
-- =========================================================
CREATE TABLE users (
    UserID INT PRIMARY KEY AUTO_INCREMENT,
    Password VARCHAR(30) NOT NULL,
    FirstName VARCHAR(30) NOT NULL,
    LastName VARCHAR(30) NOT NULL,
    Email VARCHAR(50) UNIQUE,
    Balance DECIMAL(7,2) DEFAULT 0,
    UserType SMALLINT,
    LoanPeriodDays INT NOT NULL,
    Status SMALLINT DEFAULT 1,
    CreatedAt DATETIME,
    CreatedBy INT NULL,
    UpdatedAt DATETIME,
    UpdatedBy INT NULL
) ENGINE=InnoDB;

-- =========================================================
-- ITEMS (physical items: books, media, devices)
-- =========================================================
CREATE TABLE items (
    ItemID BIGINT PRIMARY KEY,
    ItemCategory SMALLINT,
    Title VARCHAR(100) NOT NULL,
    CreatedAt DATETIME,
    CreatedBy INT,
    UpdatedAt DATETIME,
    UpdatedBy INT,
    FOREIGN KEY (CreatedBy) REFERENCES users(UserID),
    FOREIGN KEY (UpdatedBy) REFERENCES users(UserID)
) ENGINE=InnoDB;

-- =========================================================
-- LITERATURE (books, journals, etc.) book = 1, audiobook = 2 
-- =========================================================
CREATE TABLE literature (
    ItemID BIGINT PRIMARY KEY,
    ItemType SMALLINT,
    Author VARCHAR(100),
    Publisher VARCHAR(100),
    PublicationYear INT,
    FOREIGN KEY (ItemID) REFERENCES items(ItemID)
) ENGINE=InnoDB;

-- =========================================================
-- MEDIA (DVDs, CDs, etc.) DVD = 1 CD = 2 more can be added
-- =========================================================
CREATE TABLE media (
    ItemID BIGINT PRIMARY KEY,
    ItemType SMALLINT,
    Producer VARCHAR(100),
    DurationMinutes INT,
    FOREIGN KEY (ItemID) REFERENCES items(ItemID)
) ENGINE=InnoDB;

-- =========================================================
-- DEVICES (laptops, tablets, equipment) laptop=1 tablet=2 lab equipment=3
-- =========================================================
CREATE TABLE devices (
    ItemID BIGINT PRIMARY KEY,
    ItemType SMALLINT, 
    Manufacturer VARCHAR(100),
    Model VARCHAR(100),
    FOREIGN KEY (ItemID) REFERENCES items(ItemID)
) ENGINE=InnoDB;

-- =========================================================
-- COPIES (physical copies of items)
-- =========================================================
CREATE TABLE copies (
    CopyID INT PRIMARY KEY,
    ItemID BIGINT NOT NULL,
    CopyStatus SMALLINT,
    CreatedAt DATETIME,
    CreatedBy INT,
    UpdatedAt DATETIME,
    UpdatedBy INT,
    FOREIGN KEY (ItemID) REFERENCES items(ItemID),
    FOREIGN KEY (CreatedBy) REFERENCES users(UserID),
    FOREIGN KEY (UpdatedBy) REFERENCES users(UserID)
) ENGINE=InnoDB;

-- =========================================================
-- LOANS (checkouts)
-- =========================================================
CREATE TABLE loans (
    LoanID INT PRIMARY KEY AUTO_INCREMENT,
    UserID INT NOT NULL,
    CopyID INT NOT NULL,
    CreatedBy INT,
    CheckoutDate DATE NOT NULL,
    DueDate DATE NOT NULL,
    ReturnDate DATE,
    FOREIGN KEY (UserID) REFERENCES users(UserID),
    FOREIGN KEY (CopyID) REFERENCES copies(CopyID),
    FOREIGN KEY (CreatedBy) REFERENCES users(UserID)
) ENGINE=InnoDB;

-- =========================================================
-- HOLDS
-- =========================================================
CREATE TABLE holds (
    HoldID INT PRIMARY KEY AUTO_INCREMENT,
    UserID INT NOT NULL,
    ItemID BIGINT NOT NULL,
    RequestDate DATETIME NOT NULL,
    HoldStatus SMALLINT,
    FOREIGN KEY (UserID) REFERENCES users(UserID),
    FOREIGN KEY (ItemID) REFERENCES items(ItemID),
    UNIQUE (UserID, ItemID)
) ENGINE=InnoDB;

-- =========================================================
-- FINES
-- =========================================================
CREATE TABLE fines (
    FineID INT PRIMARY KEY AUTO_INCREMENT,
    LoanID INT UNIQUE,
    UserID INT NOT NULL,
    FineAmount DECIMAL(7,2) NOT NULL,
    PaidStatus SMALLINT,
    PaidAt DATETIME,
    FOREIGN KEY (LoanID) REFERENCES loans(LoanID),
    FOREIGN KEY (UserID) REFERENCES users(UserID)
) ENGINE=InnoDB;