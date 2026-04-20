-- Team 7 Library Schema

SET FOREIGN_KEY_CHECKS = 0;

-- Drop in dependency order
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS fines;
DROP TABLE IF EXISTS holds;
DROP TABLE IF EXISTS loans;
DROP TABLE IF EXISTS copies;
DROP TABLE IF EXISTS devices;
DROP TABLE IF EXISTS media;
DROP TABLE IF EXISTS literature;
DROP TABLE IF EXISTS items;
DROP TABLE IF EXISTS users;

-- 1) USERS  (UserType: 0=Student,1=Faculty,2=Librarian)

CREATE TABLE users (
    UserID INT PRIMARY KEY AUTO_INCREMENT,
    Password VARCHAR(30) NOT NULL,
    FirstName VARCHAR(30) NOT NULL,
    LastName VARCHAR(30) NOT NULL,
    Email VARCHAR(50) NOT NULL UNIQUE,
    UserType SMALLINT NOT NULL DEFAULT 0,
    LoanPeriodDays INT NOT NULL DEFAULT 14,
    Status SMALLINT NOT NULL DEFAULT 1, -- 0=Inactive, 1=Active, 2=Removed
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP(),
    CreatedBy INT NULL,
    UpdatedAt DATETIME NULL,
    UpdatedBy INT NULL,

    CHECK (UserType IN (0,1,2)),
    CHECK (LoanPeriodDays > 0),
    CHECK (Status IN (0,1,2)),

    CONSTRAINT fk_users_createdby FOREIGN KEY (CreatedBy) REFERENCES users(UserID)
        ON DELETE SET NULL,
    CONSTRAINT fk_users_updatedby FOREIGN KEY (UpdatedBy) REFERENCES users(UserID)
        ON DELETE SET NULL
) ENGINE=InnoDB;

-- 2) ITEMS  (ItemCategory: 1=Literature, 2=Media, 3=Device)

CREATE TABLE items (
    ItemID BIGINT PRIMARY KEY,
    ItemCategory SMALLINT NOT NULL,
    Title VARCHAR(100) NOT NULL,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP(),
    CreatedBy INT NULL,
    UpdatedAt DATETIME NULL,
    UpdatedBy INT NULL,

    CHECK (ItemCategory IN (1,2,3)),

    CONSTRAINT fk_items_createdby FOREIGN KEY (CreatedBy) REFERENCES users(UserID)
        ON DELETE SET NULL,
    CONSTRAINT fk_items_updatedby FOREIGN KEY (UpdatedBy) REFERENCES users(UserID)
        ON DELETE SET NULL
) ENGINE=InnoDB;

-- 3) LITERATURE subtype
--    ItemType: 1=Book,2=Textbook,3=Magazine,4=Audiobook
--    Genre: 0=Unspecified/Other,1=Classic,2=Historical Fiction,3=Fantasy,
--           4=Science Fiction/Dystopian,5=Mystery/Thriller,6=Romance,
--           7=Literary/Contemporary,8=Philosophy/Existential,9=Adventure,
--           10=Science/Technology,11=Business/Economics,12=Politics/Current Affairs,
--           13=Biography/Memoir,14=Arts/Culture,15=Horror/Gothic

CREATE TABLE literature (
    ItemID BIGINT PRIMARY KEY,
    ItemType SMALLINT NOT NULL,
    Genre SMALLINT NOT NULL DEFAULT 0,
    Author VARCHAR(100) NOT NULL,
    Publisher VARCHAR(100) NULL,
    PublicationYear INT NULL,

    CHECK (ItemType IN (1,2,3,4)),
    CHECK (Genre IN (0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15)),
    CHECK (PublicationYear IS NULL OR PublicationYear > 0),

    CONSTRAINT fk_lit_item FOREIGN KEY (ItemID) REFERENCES items(ItemID)
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4) MEDIA subtype
--    ItemType: 1=DVD/CD,2=BluRay,3=Vinyl
--    Genre: 0=Unspecified/Other,1=Drama,2=Crime/Noir,3=Action/Adventure,
--           4=Science Fiction/Fantasy,5=Thriller/Mystery,6=Comedy,7=Romance,
--           8=Documentary/Biography,9=Horror,10=Rock/Alternative,11=Pop,
--           12=Hip-Hop/Rap,13=R&B/Soul/Funk,14=Folk/Country,15=Jazz/Blues,
--           16=Classical/Soundtrack

CREATE TABLE media (
    ItemID BIGINT PRIMARY KEY,
    ItemType SMALLINT NOT NULL,
    Genre SMALLINT NOT NULL DEFAULT 0,
    Producer VARCHAR(100) NULL,
    DurationMinutes INT NULL,

    CHECK (ItemType IN (1,2,3)),
    CHECK (Genre IN (0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16)),
    CHECK (DurationMinutes IS NULL OR DurationMinutes > 0),

    CONSTRAINT fk_media_item FOREIGN KEY (ItemID) REFERENCES items(ItemID)
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5) DEVICES subtype (ItemType: 1=Laptop,2=Tablet,3=Calculator)

CREATE TABLE devices (
    ItemID BIGINT PRIMARY KEY,
    ItemType SMALLINT NOT NULL,
    Manufacturer VARCHAR(100) NULL,
    Model VARCHAR(100) NULL,

    CHECK (ItemType IN (1,2,3)),

    CONSTRAINT fk_dev_item FOREIGN KEY (ItemID) REFERENCES items(ItemID)
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6) COPIES

CREATE TABLE copies (
    CopyID INT PRIMARY KEY AUTO_INCREMENT,
    ItemID BIGINT NOT NULL,
    CopyStatus SMALLINT NOT NULL DEFAULT 0, -- 0=Available,1=OnLoan, 2=Removed
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP(),
    CreatedBy INT NULL,
    UpdatedAt DATETIME NULL,
    UpdatedBy INT NULL,

    CHECK (CopyStatus IN (0,1,2)),

    CONSTRAINT fk_copies_item FOREIGN KEY (ItemID) REFERENCES items(ItemID)
        ON DELETE CASCADE,
    CONSTRAINT fk_copies_createdby FOREIGN KEY (CreatedBy) REFERENCES users(UserID)
        ON DELETE SET NULL,
    CONSTRAINT fk_copies_updatedby FOREIGN KEY (UpdatedBy) REFERENCES users(UserID)
        ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_copies_item ON copies(ItemID);
CREATE INDEX idx_copies_status ON copies(CopyStatus);

-- 7) LOANS
-- Active loan = ReturnDate IS NULL

CREATE TABLE loans (
    LoanID INT PRIMARY KEY AUTO_INCREMENT,
    UserID INT NOT NULL,
    CopyID INT NOT NULL,
    DueDate DATETIME NOT NULL,
    ReturnDate DATETIME NULL,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP(),
    CreatedBy INT NULL,
    UpdatedAt DATETIME NULL,
    UpdatedBy INT NULL,


    ActiveLoan TINYINT AS (IF(ReturnDate IS NULL, 1, NULL)) STORED,

    CONSTRAINT fk_loans_user FOREIGN KEY (UserID) REFERENCES users(UserID)
        ON DELETE CASCADE,
    CONSTRAINT fk_loans_copy FOREIGN KEY (CopyID) REFERENCES copies(CopyID)
        ON DELETE CASCADE,
    CONSTRAINT fk_loans_createdby FOREIGN KEY (CreatedBy) REFERENCES users(UserID)
        ON DELETE SET NULL,
    CONSTRAINT fk_loans_updatedby FOREIGN KEY (UpdatedBy) REFERENCES users(UserID)
        ON DELETE SET NULL,


CHECK (DueDate >= CreatedAt),
CHECK (ReturnDate IS NULL OR ReturnDate >= CreatedAt)
) ENGINE=InnoDB;

CREATE INDEX idx_loans_user_active ON loans(UserID, ReturnDate);
CREATE INDEX idx_loans_copy_active ON loans(CopyID, ReturnDate);

CREATE UNIQUE INDEX uq_loans_copy_one_active ON loans(CopyID, ActiveLoan);

-- =========================================================
-- Table: Holds
-- =========================================================
-- HoldStatus: 0=Active, 1=Fulfilled, 2=Cancelled

CREATE TABLE holds (
    HoldID INT PRIMARY KEY AUTO_INCREMENT,
    UserID INT NOT NULL,
    ItemID BIGINT NOT NULL,
    HoldStatus SMALLINT NOT NULL DEFAULT 0,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP(),
    CreatedBy INT NULL,
    UpdatedAt DATETIME NULL,
    UpdatedBy INT NULL,

    ActiveHold TINYINT AS (HoldStatus = 0) STORED,

    CHECK (HoldStatus IN (0,1,2)),

    CONSTRAINT fk_holds_user FOREIGN KEY (UserID) REFERENCES users(UserID)
        ON DELETE CASCADE,
    CONSTRAINT fk_holds_item FOREIGN KEY (ItemID) REFERENCES items(ItemID)
        ON DELETE CASCADE,
    CONSTRAINT fk_holds_createdby FOREIGN KEY (CreatedBy) REFERENCES users(UserID)
        ON DELETE SET NULL,
    CONSTRAINT fk_holds_updatedby FOREIGN KEY (UpdatedBy) REFERENCES users(UserID)
        ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_holds_item_fifo ON holds(ItemID, HoldStatus, CreatedAt);
CREATE UNIQUE INDEX uq_holds_user_item_one_active ON holds(UserID, ItemID, ActiveHold);

-- =========================================================
-- Table: Fines
-- =========================================================
-- PaidStatus: 0=Unpaid, 1=Paid

CREATE TABLE fines (
    FineID INT PRIMARY KEY AUTO_INCREMENT,
    LoanID INT NOT NULL,
    UserID INT NOT NULL,
    FineAmount DECIMAL(7,2) NOT NULL DEFAULT 0.00,
    PaidStatus SMALLINT NOT NULL DEFAULT 0,
    PaidAt DATETIME NULL,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP(),
    CreatedBy INT NULL,
    UpdatedAt DATETIME NULL, -- The exact day the overdue status first began, aka “the timestamp when the system recorded or refreshed the fine.”
    UpdatedBy INT NULL,


    CHECK (FineAmount >= 0),
    CHECK (PaidStatus IN (0,1)),

    CONSTRAINT fk_fines_loan FOREIGN KEY (LoanID) REFERENCES loans(LoanID)
        ON DELETE CASCADE,
    CONSTRAINT fk_fines_user FOREIGN KEY (UserID) REFERENCES users(UserID)
        ON DELETE CASCADE,
    CONSTRAINT fk_fines_createdby FOREIGN KEY (CreatedBy) REFERENCES users(UserID)
        ON DELETE SET NULL,
    CONSTRAINT fk_fines_updatedby FOREIGN KEY (UpdatedBy) REFERENCES users(UserID)
        ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_fines_user_paid ON fines(UserID, PaidStatus);

CREATE UNIQUE INDEX uq_fines_one_per_loan ON fines(LoanID);

-- =========================================================
-- Table: Notifications
-- =========================================================

CREATE TABLE notifications (
    NotificationID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT NOT NULL,
    Header VARCHAR(100) NOT NULL,
    Body TEXT NOT NULL,
    IsRead SMALLINT NOT NULL DEFAULT 0,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CreatedBy INT NULL,
    UpdatedAt DATETIME NULL,
    UpdatedBy INT NULL,
    
    CONSTRAINT chk_notifications_isread
        CHECK (IsRead IN (0, 1)),

    CONSTRAINT fk_notifications_user
        FOREIGN KEY (UserID) REFERENCES users(UserID)
        ON DELETE CASCADE,

    CONSTRAINT fk_notifications_createdby
        FOREIGN KEY (CreatedBy) REFERENCES users(UserID)
        ON DELETE SET NULL,

    CONSTRAINT fk_notifications_updatedby
        FOREIGN KEY (UpdatedBy) REFERENCES users(UserID)
        ON DELETE SET NULL
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;
