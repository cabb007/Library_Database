-- Team 7 Library Schema 

SET FOREIGN_KEY_CHECKS = 0;

-- Drop in dependency order
DROP TABLE IF EXISTS fines;
DROP TABLE IF EXISTS holds;
DROP TABLE IF EXISTS loans;
DROP TABLE IF EXISTS copies;
DROP TABLE IF EXISTS devices;
DROP TABLE IF EXISTS media;
DROP TABLE IF EXISTS literature;
DROP TABLE IF EXISTS items;
DROP TABLE IF EXISTS users;

-- 1) USERS  (UserType: 0=Student,1=Faculty,2=Librarian; Status: 0=Blocked,1=Active)

CREATE TABLE users (
    UserID INT PRIMARY KEY AUTO_INCREMENT,
    Password VARCHAR(30) NOT NULL,                 
    FirstName VARCHAR(30) NOT NULL,
    LastName  VARCHAR(30) NOT NULL,
    Email     VARCHAR(50) NOT NULL UNIQUE,
    Balance   DECIMAL(7,2) NOT NULL DEFAULT 0.00,
    UserType  SMALLINT NOT NULL DEFAULT 0,                    -- 0,1,2
    LoanPeriodDays  INT NOT NULL DEFAULT 14,                   -- loan duration
    Status    SMALLINT NOT NULL DEFAULT 1,          -- 0/1
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CreatedBy INT NULL,
    UpdatedAt DATETIME NULL,
    UpdatedBy INT NULL,

    CHECK (UserType IN (0,1,2)),
    CHECK (LoanPeriodDays > 0),
    CHECK (Status IN (0,1)),

    CONSTRAINT fk_users_createdby FOREIGN KEY (CreatedBy) REFERENCES users(UserID),
        ON DELETE CASCADE,
    CONSTRAINT fk_users_updatedby FOREIGN KEY (UpdatedBy) REFERENCES users(UserID),
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- 2) ITEMS  (ItemCategory: 1=Literature, 2=Media, 3=Device)

CREATE TABLE items (
    ItemID BIGINT PRIMARY KEY,
    ItemCategory SMALLINT NOT NULL,                 -- 1..3
    Title VARCHAR(100) NOT NULL,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CreatedBy INT NOT NULL,
    UpdatedAt DATETIME NULL,
    UpdatedBy INT NULL,

    CHECK (ItemCategory IN (1,2,3)),

    CONSTRAINT fk_items_createdby FOREIGN KEY (CreatedBy) REFERENCES users(UserID),
        ON DELETE CASCADE,
    CONSTRAINT fk_items_updatedby FOREIGN KEY (UpdatedBy) REFERENCES users(UserID),
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3) LITERATURE subtype (ItemType: 1=Book,2=Textbook,3=Magazine,4=Audiobook)

CREATE TABLE literature (
    ItemID BIGINT PRIMARY KEY,
    ItemType SMALLINT NOT NULL,                     -- 1..4
    Author VARCHAR(100) NOT NULL,
    Publisher VARCHAR(100) NULL,
    PublicationYear INT NULL,

    CHECK (ItemType IN (1,2,3,4)),

    CONSTRAINT fk_lit_item FOREIGN KEY (ItemID) REFERENCES items(ItemID),
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4) MEDIA subtype (ItemType: 1=DVD/CD,2=BluRay,3=Vinyl)

CREATE TABLE media (
    ItemID BIGINT PRIMARY KEY,
    ItemType SMALLINT NOT NULL,                     -- 1..3
    Producer VARCHAR(100) NULL,
    DurationMinutes INT NULL,

    CHECK (ItemType IN (1,2,3)),
    CHECK (DurationMinutes IS NULL OR DurationMinutes > 0),

    CONSTRAINT fk_media_item FOREIGN KEY (ItemID) REFERENCES items(ItemID),
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5) DEVICES subtype (ItemType: 1=Laptop,2=Tablet,3=Calculator)

CREATE TABLE devices (
    ItemID BIGINT PRIMARY KEY,
    ItemType SMALLINT NOT NULL,                     -- 1..3
    Manufacturer VARCHAR(100) NULL,
    Model VARCHAR(100) NULL,

    CHECK (ItemType IN (1,2,3)),

    CONSTRAINT fk_dev_item FOREIGN KEY (ItemID) REFERENCES items(ItemID)
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6) COPIES (CopyStatus: 0=Available,1=OnLoan) -No longer using "Lost" or "Repair" status for simplicity

CREATE TABLE copies (
    CopyID INT PRIMARY KEY, -- Temp removing autoincrement because of error with csv files
    ItemID BIGINT NOT NULL,
    CopyStatus SMALLINT NOT NULL DEFAULT 0,         -- 0..3
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CreatedBy INT NOT NULL,
    UpdatedAt DATETIME NULL,
    UpdatedBy INT NULL,

    CHECK (CopyStatus IN (0,1)),

    CONSTRAINT fk_copies_item FOREIGN KEY (ItemID) REFERENCES items(ItemID),
        ON DELETE CASCADE
    CONSTRAINT fk_copies_createdby FOREIGN KEY (CreatedBy) REFERENCES users(UserID),
        ON DELETE CASCADE
    CONSTRAINT fk_copies_updatedby FOREIGN KEY (UpdatedBy) REFERENCES users(UserID)
        ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_copies_item ON copies(ItemID);
CREATE INDEX idx_copies_status ON copies(CopyStatus);

-- 7) LOANS
-- Enforces: a copy may have at most one active loan at a time
-- Active loan = ReturnDate IS NULL  -> via generated column + unique index

CREATE TABLE loans (
    LoanID INT PRIMARY KEY AUTO_INCREMENT,
    UserID INT NOT NULL,
    CopyID INT NOT NULL,
    CreatedBy INT NOT NULL,                         -- librarian/system user who created loan
    CheckoutDate DATE NOT NULL,
    DueDate DATE NOT NULL,
    ReturnDate DATE NULL,

    -- Generated column for "active" (1 if ReturnDate IS NULL else 0)
    ActiveLoan TINYINT AS (ReturnDate IS NULL) STORED,

    CONSTRAINT fk_loans_user FOREIGN KEY (UserID) REFERENCES users(UserID),
        ON DELETE CASCADE,
    CONSTRAINT fk_loans_copy FOREIGN KEY (CopyID) REFERENCES copies(CopyID),
        ON DELETE CASCADE,
    CONSTRAINT fk_loans_createdby FOREIGN KEY (CreatedBy) REFERENCES users(UserID),
        ON DELETE CASCADE,

    CHECK (DueDate >= CheckoutDate),
    CHECK (ReturnDate IS NULL OR ReturnDate >= CheckoutDate)
) ENGINE=InnoDB;

CREATE INDEX idx_loans_user_active ON loans(UserID, ReturnDate);
CREATE INDEX idx_loans_copy_active ON loans(CopyID, ReturnDate);

-- One active loan per copy (prevents multiple rows with CopyID and ActiveLoan=1)
CREATE UNIQUE INDEX uq_loans_copy_one_active ON loans(CopyID, ActiveLoan);

-- 8) HOLD REQUESTS
-- HoldStatus: 0=Active, 1=Fulfilled, 2=Cancelled
-- Enforces: user may not have > 1 active hold for same item
-- Active hold = HoldStatus=0 -> via generated column + unique index
-- FIFO by RequestDate (index below)

CREATE TABLE holds (
    HoldID INT PRIMARY KEY AUTO_INCREMENT,
    UserID INT NOT NULL,
    ItemID BIGINT NOT NULL,
    RequestDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    HoldStatus SMALLINT NOT NULL DEFAULT 0,

    -- Generated column for "active" (1 if HoldStatus=0 else 0)
    ActiveHold TINYINT AS (HoldStatus = 0) STORED,

    CHECK (HoldStatus IN (0,1,2)),

    CONSTRAINT fk_holds_user FOREIGN KEY (UserID) REFERENCES users(UserID),
        ON DELETE CASCADE,
    CONSTRAINT fk_holds_item FOREIGN KEY (ItemID) REFERENCES items(ItemID),
        ON DELETE CASCADE,
) ENGINE=InnoDB;

CREATE INDEX idx_holds_item_fifo ON holds(ItemID, HoldStatus, RequestDate);

-- One active hold per (UserID, ItemID)
CREATE UNIQUE INDEX uq_holds_user_item_one_active ON holds(UserID, ItemID, ActiveHold);

-- 9) FINES
-- PaidStatus: 0=Unpaid, 1=Paid
-- Enforces: zero or one fine per loan (unique LoanID)
CREATE TABLE fines (
    FineID INT PRIMARY KEY AUTO_INCREMENT,
    LoanID INT NOT NULL,
    UserID INT NOT NULL,
    FineAmount DECIMAL(7,2) NOT NULL DEFAULT 0.00,
    PaidStatus SMALLINT NOT NULL DEFAULT 0,
    PaidAt DATETIME NULL,

    CHECK (FineAmount >= 0),
    CHECK (PaidStatus IN (0,1)),

    CONSTRAINT fk_fines_loan FOREIGN KEY (LoanID) REFERENCES loans(LoanID),
    CONSTRAINT fk_fines_user FOREIGN KEY (UserID) REFERENCES users(UserID)
) ENGINE=InnoDB;

CREATE INDEX idx_fines_user_paid ON fines(UserID, PaidStatus);

-- Zero or one fine per loan
CREATE UNIQUE INDEX uq_fines_one_per_loan ON fines(LoanID);

