-- Team 7 Library Schema 

CREATE DATABASE IF NOT EXISTS library_db;
USE library_db;

SET FOREIGN_KEY_CHECKS = 0;

-- Drop in dependency order
DROP TABLE IF EXISTS Fines;
DROP TABLE IF EXISTS HoldRequests;
DROP TABLE IF EXISTS Loans;
DROP TABLE IF EXISTS Copies;
DROP TABLE IF EXISTS Devices;
DROP TABLE IF EXISTS Media;
DROP TABLE IF EXISTS Literature;
DROP TABLE IF EXISTS Items;
DROP TABLE IF EXISTS Users;

-- 1) USERS  (UserType: 0=Student,1=Faculty,2=Librarian; Status: 0=Blocked,1=Active)

CREATE TABLE Users (
    UserID INT PRIMARY KEY AUTO_INCREMENT,
    Password VARCHAR(30) NOT NULL,                 
    FirstName VARCHAR(30) NOT NULL,
    LastName  VARCHAR(30) NOT NULL,
    Email     VARCHAR(50) NOT NULL UNIQUE,
    Balance   DECIMAL(7,2) NOT NULL DEFAULT 0.00,
    UserType  SMALLINT NOT NULL,                    -- 0,1,2
    MaxItemsAllowed INT NOT NULL,                   -- borrow limit
    LoanPeriodDays  INT NOT NULL,                   -- loan duration
    Status    SMALLINT NOT NULL DEFAULT 1,          -- 0/1
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CreatedBy INT NULL,
    UpdatedAt DATETIME NULL,
    UpdatedBy INT NULL,

    CHECK (UserType IN (0,1,2)),
    CHECK (MaxItemsAllowed >= 0),
    CHECK (LoanPeriodDays > 0),
    CHECK (Status IN (0,1)),

    CONSTRAINT fk_users_createdby FOREIGN KEY (CreatedBy) REFERENCES Users(UserID),
    CONSTRAINT fk_users_updatedby FOREIGN KEY (UpdatedBy) REFERENCES Users(UserID)
) ENGINE=InnoDB;

-- 2) ITEMS  (ItemCategory: 1=Literature, 2=Media, 3=Device)

CREATE TABLE Items (
    ItemID INT PRIMARY KEY AUTO_INCREMENT,
    ItemCategory SMALLINT NOT NULL,                 -- 1..3
    Title VARCHAR(100) NOT NULL,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CreatedBy INT NOT NULL,
    UpdatedAt DATETIME NULL,
    UpdatedBy INT NULL,

    CHECK (ItemCategory IN (1,2,3)),

    CONSTRAINT fk_items_createdby FOREIGN KEY (CreatedBy) REFERENCES Users(UserID),
    CONSTRAINT fk_items_updatedby FOREIGN KEY (UpdatedBy) REFERENCES Users(UserID)
) ENGINE=InnoDB;

-- 3) LITERATURE subtype (ItemType: 1=Book,2=Textbook,3=Magazine,4=Audiobook)

CREATE TABLE Literature (
    ItemID INT PRIMARY KEY,
    ItemType SMALLINT NOT NULL,                     -- 1..4
    Author VARCHAR(100) NOT NULL,
    Publisher VARCHAR(100) NULL,
    PublicationYear INT NULL,

    CHECK (ItemType IN (1,2,3,4)),

    CONSTRAINT fk_lit_item FOREIGN KEY (ItemID) REFERENCES Items(ItemID)
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4) MEDIA subtype (ItemType: 5=DVD/CD,6=BluRay,7=Vinyl)

CREATE TABLE Media (
    ItemID INT PRIMARY KEY,
    ItemType SMALLINT NOT NULL,                     -- 5..7
    Producer VARCHAR(100) NULL,
    DurationMinutes INT NULL,

    CHECK (ItemType IN (5,6,7)),
    CHECK (DurationMinutes IS NULL OR DurationMinutes > 0),

    CONSTRAINT fk_media_item FOREIGN KEY (ItemID) REFERENCES Items(ItemID)
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5) DEVICES subtype (ItemType: 8=Laptop,9=Tablet,10=Calculator)

CREATE TABLE Devices (
    ItemID INT PRIMARY KEY,
    ItemType SMALLINT NOT NULL,                     -- 8..10
    Manufacturer VARCHAR(100) NULL,
    Model VARCHAR(100) NULL,

    CHECK (ItemType IN (8,9,10)),

    CONSTRAINT fk_dev_item FOREIGN KEY (ItemID) REFERENCES Items(ItemID)
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6) COPIES (CopyStatus: 0=Available,1=OnLoan,2=Lost,3=Repair)

CREATE TABLE Copies (
    CopyID INT PRIMARY KEY AUTO_INCREMENT,
    ItemID INT NOT NULL,
    CopyStatus SMALLINT NOT NULL DEFAULT 0,         -- 0..3
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CreatedBy INT NOT NULL,
    UpdatedAt DATETIME NULL,
    UpdatedBy INT NULL,

    CHECK (CopyStatus IN (0,1,2,3)),

    CONSTRAINT fk_copies_item FOREIGN KEY (ItemID) REFERENCES Items(ItemID),
    CONSTRAINT fk_copies_createdby FOREIGN KEY (CreatedBy) REFERENCES Users(UserID),
    CONSTRAINT fk_copies_updatedby FOREIGN KEY (UpdatedBy) REFERENCES Users(UserID)
) ENGINE=InnoDB;

CREATE INDEX idx_copies_item ON Copies(ItemID);
CREATE INDEX idx_copies_status ON Copies(CopyStatus);

-- 7) LOANS
-- Enforces: a copy may have at most one active loan at a time
-- Active loan = ReturnDate IS NULL  -> via generated column + unique index

CREATE TABLE Loans (
    LoanID INT PRIMARY KEY AUTO_INCREMENT,
    UserID INT NOT NULL,
    CopyID INT NOT NULL,
    CreatedBy INT NOT NULL,                         -- librarian/system user who created loan
    CheckoutDate DATE NOT NULL,
    DueDate DATE NOT NULL,
    ReturnDate DATE NULL,

    -- Generated column for "active" (1 if ReturnDate IS NULL else 0)
    ActiveLoan TINYINT AS (ReturnDate IS NULL) STORED,

    CONSTRAINT fk_loans_user FOREIGN KEY (UserID) REFERENCES Users(UserID),
    CONSTRAINT fk_loans_copy FOREIGN KEY (CopyID) REFERENCES Copies(CopyID),
    CONSTRAINT fk_loans_createdby FOREIGN KEY (CreatedBy) REFERENCES Users(UserID),

    CHECK (DueDate >= CheckoutDate),
    CHECK (ReturnDate IS NULL OR ReturnDate >= CheckoutDate)
) ENGINE=InnoDB;

CREATE INDEX idx_loans_user_active ON Loans(UserID, ReturnDate);
CREATE INDEX idx_loans_copy_active ON Loans(CopyID, ReturnDate);

-- One active loan per copy (prevents multiple rows with CopyID and ActiveLoan=1)
CREATE UNIQUE INDEX uq_loans_copy_one_active ON Loans(CopyID, ActiveLoan);

-- 8) HOLD REQUESTS
-- HoldStatus: 0=Active, 1=Fulfilled, 2=Cancelled
-- Enforces: user may not have > 1 active hold for same item
-- Active hold = HoldStatus=0 -> via generated column + unique index
-- FIFO by RequestDate (index below)

CREATE TABLE HoldRequests (
    HoldID INT PRIMARY KEY AUTO_INCREMENT,
    UserID INT NOT NULL,
    ItemID INT NOT NULL,
    RequestDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    HoldStatus SMALLINT NOT NULL DEFAULT 0,

    -- Generated column for "active" (1 if HoldStatus=0 else 0)
    ActiveHold TINYINT AS (HoldStatus = 0) STORED,

    CHECK (HoldStatus IN (0,1,2)),

    CONSTRAINT fk_holds_user FOREIGN KEY (UserID) REFERENCES Users(UserID),
    CONSTRAINT fk_holds_item FOREIGN KEY (ItemID) REFERENCES Items(ItemID)
) ENGINE=InnoDB;

CREATE INDEX idx_holds_item_fifo ON HoldRequests(ItemID, HoldStatus, RequestDate);

-- One active hold per (UserID, ItemID)
CREATE UNIQUE INDEX uq_holds_user_item_one_active ON HoldRequests(UserID, ItemID, ActiveHold);

-- 9) FINES
-- PaidStatus: 0=Unpaid, 1=Paid
-- Enforces: zero or one fine per loan (unique LoanID)
CREATE TABLE Fines (
    FineID INT PRIMARY KEY AUTO_INCREMENT,
    LoanID INT NOT NULL,
    UserID INT NOT NULL,
    FineAmount DECIMAL(7,2) NOT NULL DEFAULT 0.00,
    PaidStatus SMALLINT NOT NULL DEFAULT 0,
    PaidAt DATETIME NULL,

    CHECK (FineAmount >= 0),
    CHECK (PaidStatus IN (0,1)),

    CONSTRAINT fk_fines_loan FOREIGN KEY (LoanID) REFERENCES Loans(LoanID),
    CONSTRAINT fk_fines_user FOREIGN KEY (UserID) REFERENCES Users(UserID)
) ENGINE=InnoDB;

CREATE INDEX idx_fines_user_paid ON Fines(UserID, PaidStatus);

-- Zero or one fine per loan
CREATE UNIQUE INDEX uq_fines_one_per_loan ON Fines(LoanID);

SET FOREIGN_KEY_CHECKS = 1;