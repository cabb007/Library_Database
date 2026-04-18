import express from "express";
import fs from "fs";
import mysql from "mysql2/promise";
import cors from "cors";
import path from "path";
import session from "express-session";
import "dotenv/config";
import { fileURLToPath } from "url";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const imageRoot = path.join(__dirname, "SQLserver", "data", "images");
const SHELF_LIMIT = 10;
const ITEM_TYPE_LABELS = {
  literature: {
    1: "Book",
    2: "Textbook",
    3: "Magazine",
    4: "Audiobook",
  },
  media: {
    1: "DVD / CD",
    2: "Blu-ray",
    3: "Vinyl",
  },
  devices: {
    1: "Laptop",
    2: "Tablet",
    3: "Equipment",
  },
};

app.set("trust proxy", 1);

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://localhost:4280",
      "https://brave-field-0e8fa9510.1.azurestaticapps.net",
    ],
    credentials: true,
  })
);

app.use("/library-images", express.static(imageRoot));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

app.use("/library-images", express.static(imageRoot));

app.get("/", (req, res) => {
    res.send("Backend is running");
});

app.get("/health", (req, res) => {
    res.status(200).send("ok");
});
  
  const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 3306,
  ssl: {
    rejectUnauthorized: false
  }});

console.log("db loaded");

/* ================= HELPERS ================= */

function buildImageIndex(folderName) {
  const directory = path.join(imageRoot, folderName);

  if (!fs.existsSync(directory)) {
    return new Map();
  }

  return new Map(
    fs
      .readdirSync(directory)
      .filter((fileName) => /\.(jpe?g|png|webp)$/i.test(fileName))
      .map((fileName) => [path.parse(fileName).name, fileName])
  );
}

const SHELF_IMAGE_INDEXES = {
  literature: buildImageIndex("literature"),
  media: buildImageIndex("media"),
  devices: buildImageIndex("devices"),
};

function normalizeAvailableCopies(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function buildAssetUrl(req, folderName, fileName) {
  return `${req.protocol}://${req.get("host")}/library-images/${folderName}/${encodeURIComponent(fileName)}`;
}

function buildShelf(records, imageIndex, getImageKey) {
  return records
    .map((record) => {
      const fileName = imageIndex.get(getImageKey(record));

      if (!fileName) {
        return null;
      }

      return {
        ...record,
        availableCopies: normalizeAvailableCopies(record.availableCopies),
        fileName,
      };
    })
    .filter(Boolean)
    .sort(
      (left, right) =>
        right.availableCopies - left.availableCopies ||
        left.title.localeCompare(right.title)
    )
    .slice(0, SHELF_LIMIT);
}

function handleSqlError(res, err, fallbackMessage = "Request failed") {
  console.error(err);

  if (err.code === "ER_DUP_ENTRY") {
    return res.status(409).json({ error: "Duplicate entry" });
  }

  if (err.sqlState === "45000") {
    return res.status(400).json({ error: err.sqlMessage });
  }

  return res.status(500).json({ error: fallbackMessage });
}

function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: "Not logged in" });
  }
  next();
}

function requireLibrarian(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: "Not logged in" });
  }

  if (req.session.user.UserType !== 2) {
    return res.status(403).json({ error: "Access denied" });
  }

  next();
}

/* ================= REGISTER ================= */

app.post("/api/users", async (req, res) => {
    try {
        const { Password, FirstName, LastName, Email } = req.body;

        // '?.trim()' checks for empty strings or strings with only whitespace
        if (!Password?.trim() || !FirstName?.trim() || !LastName?.trim() || !Email?.trim()) { 
            return res.status(400).json({ error: "First name, last name, email and password are required." });
        }

        await db.execute(
            "CALL CreateUser(?,?,?,?)",
            [Password, FirstName, LastName, Email]
        );

        const [rows] = await db.execute(
            "SELECT UserID FROM users WHERE Email = ?",
            [Email]
        );


        res.status(201).json({
            message: "User registered successfully.",
            id: rows[0].UserID
        });
    
    } catch (error) {
        console.error("Insert Failed: ", error);
        
        // Handles duplicate email error due to UNIQUE constraint on Email in users table
        if (error.code === "ER_DUP_ENTRY") {  
            return res.status(409).json({
                error: "A user with that email already exists."
            });
        }
        // Various SQL SIGNAL errors from CreateUser procedure (e.g. invalid email format, password length too short)
        if (error.sqlState === "45000") { 
            return res.status(400).json({
                error: error.sqlMessage
            });
        }

        res.status(500).json({ error: "Failed to register user" });
    }
});

/* ================= LOGIN ================= */

app.post("/api/login", async (req, res) => {
    const { Email, Password } = req.body;

    try {
        if (!Email?.trim() || !Password?.trim()) {
            return res.status(400).json({ error: "Email and password required" });
        }
        const [rows] = await db.execute(
            "SELECT * FROM users WHERE Email = ?",
            [Email]
        );

        if (rows.length === 0 || rows[0].Password !== Password) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const user = rows[0];

        if (Password != user.Password) {
            return res.status(401).json({ success: false, message: "invalid credentials" });
        }

        req.session.user = {
            UserID: user.UserID,
            Email: user.Email,
            FirstName: user.FirstName,
            LastName: user.LastName,
            UserType: user.UserType,
            Balance: user.Balance,
            ConfirmFlag: 0,
            SelectedItem: null
        };

        req.session.save(err => {
            if (err) {
                return res.status(500).json({ error: "Session save failed" });
            }
            res.json({ success: true, user: req.session.user });
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

//logout as a user, ends/'destroys' the session
app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Logout failed: ", err);
            return res.status(500).json({
                success: false,
                message: "Logout failed"
            });
        }
    })

    res.clearCookie("connect.sid");

    return res.json({
        success: true,
        message: "Logged out"
    });
});

/* ================= AUTH ================= */

app.get("/api/me", (req, res) => {
    if (!req.session.user) { //checks if user is logged in/session active
        return res.status(401).json({
            loggedIn: false
        });
    }

    return res.json({
        loggedIn: true,
        user: req.session.user
    });
});

//logout as a user, ends/'destroys' the session
app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Logout failed: ", err);
            return res.status(500).json({
                success: false,
                message: "Logout failed"
            });
        }
    })

    res.clearCookie("connect.sid");

    return res.json({
        success: true,
        message: "Logged out"
    });
});

/* ================= SESSION STATE ================= */

app.get("/api/changeConfirmflag", (req, res) => {
    const value = Number(req.query.value);

    if (!req.session.user) {
        return res.status(401).json({ error: "Not logged in" });
    }

    req.session.user.ConfirmFlag = value;

    req.session.save(() => {
        res.json({ success: true });
    });
});

/* FIXED: consistent session usage */
app.get("/api/setSelectedItem", (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: "Not logged in" });
    }

    req.session.user.SelectedItem = req.query.value;

    req.session.save(() => {
        res.json({ success: true });
    });
});

app.get("/api/confirmdata", (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: "Not logged in" });
    }

    res.json({
        ConfirmFlag: req.session.user.ConfirmFlag,
        SelectedItem: req.session.user.SelectedItem
    });
});

/* ================= CHECKOUT AND HOLD================= */

app.post("/api/checkout", async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: "Not logged in" });
    }

    const userID = req.session.user.UserID;
    const itemID = req.session.user.SelectedItem;

    if (!itemID) {
        return res.status(400).json({ error: "No item selected" });
    }

    try {
        await db.execute("CALL CheckoutItem(?, ?)", [userID, itemID]);

        // reset selection after success
        req.session.user.SelectedItem = null;

        req.session.save(() => {
            res.json({ success: true, message: "Item checked out" });
        });

    } catch (err) {
        console.error(err);

        // Custom SQL SIGNAL error, should fix the 500 server status issue and return a 400 with the specific error message from the procedure
        if (err.sqlState === "45000") {
            return res.status(400).json({ error: err.sqlMessage });
        }
        res.status(500).json({ error: err.sqlMessage || "Checkout failed" });
    }
});

// Create a hold for the selected item via CreateHold
app.post("/api/hold", async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: "Not logged in" });
    }

    const userID = req.session.user.UserID;
    const itemID = req.session.user.SelectedItem;

    if (!itemID) {
        return res.status(400).json({ error: "No item selected" });
    }

    try {
        await db.execute("CALL CreateHold(?, ?)", [userID, itemID]);

        req.session.user.SelectedItem = null;

        req.session.save(() => {
            res.json({ success: true, message: "Hold placed" });
        });

    } catch (err) {
        console.error(err);

        if (err.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ error: "Already holding this item" });
        }

        // Custom SQL SIGNAL errors from CreateHold procedure (e.g. user already has a loan or hold on this item)
        if (err.sqlState === "45000") {
            return res.status(409).json({ error: err.sqlMessage });
        }

        res.status(500).json({ error: "Hold failed" });
    }
});

/* ================= LIBRARIAN ================= */

// middleware: require librarian (UserType 2)
function requireLibrarian(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({ error: "Not logged in" });
    }
    if (req.session.user.UserType !== 2) {
        return res.status(403).json({ error: "Access denied" });
    }
    next();
}

// get all users
app.get("/api/librarian/users", requireLibrarian, async (req, res) => {
    try {
        const [rows] = await db.execute("CALL GetUsers()");
        res.json(rows[0]); // Stored procedure returns results in nested arrays
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch users" });
    }
});

// Add a new user via AddUser (students and faculty only)
app.post("/api/librarian/users", requireLibrarian, async (req, res) => {
    try {
        const { Password, FirstName, LastName, Email, UserType } = req.body;

        // '?.trim()' checks for empty strings or strings with only whitespace
        if (!Password?.trim() || !FirstName?.trim() || !LastName?.trim() || !Email?.trim()) {
            return res.status(400).json({ error: "First name, last name, email, and password are required." });
        }

        const userType = Number(UserType) || 0;
        const librarianID = req.session.user.UserID;

        await db.execute("CALL AddUser(?, ?, ?, ?, ?, ?)",
            [Password, FirstName, LastName, Email, userType, librarianID]);

        const [rows] = await db.execute("SELECT UserID FROM users where Email = ?", 
            [Email]);

        res.status(201).json({ 
            message: "User added", 
            id: rows[0].UserID });
    } catch (err) {
        console.error(err);
        if (err.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ error: "A user with that email already exists" });
        }
        if (err.sqlState === "45000") {
            return res.status(400).json({ error: err.sqlMessage});
        }
        res.status(500).json({ error: "Failed to add user" });
    }
});

// Delete a user via DeleteUser (prevents deletion if there are fines, loans, or holds active)
app.delete("/api/librarian/users/:id", requireLibrarian, async (req, res) => {
    try {
        const userId = req.params.id;

        if (Number(userId) === req.session.user.UserID) {
            return res.status(400).json({ error: "Cannot delete your own account" });
        }

        await db.execute("CALL DeleteUser(?)", [userId]);
        res.json({ message: "User deleted" });

    } catch (err) {
        console.error(err);

        //SQL SIGNAL errors - used in DeleteUser procedure
        if (err.sqlState === "45000") {
            return res.status(409).json({ error: err.sqlMessage });
        }
        // If user didn't exist (no rows deleted)
        if (err.sqlMessage === "User not found.") {
            return res.status(404).json({ error: "User not found" });
        }

        res.status(500).json({ error: "Failed to delete user" });
    }
});

/* ================= DATA ================= */

app.get("/api/literature", async (req, res) => {
    try {
    const [data] = await db.execute("CALL GetLiterature()");
    res.json(data[0]);
    } catch (err) {
        console.error("Failed to fetch literature: ", err);
        res.status(500).json({ error: "Failed to fetch literature" });
    }
});

app.get("/api/media", async (req, res) => {
    try {
        const [data] = await db.execute("CALL GetMedia()");
        res.json(data[0]);
    } catch (err) {
        console.error("Failed to fetch media: ", err);
        res.status(500).json({ error: "Failed to fetch media" });
    }
});

app.get("/api/devices", async (req, res) => {
  try {
    const [data] = await db.execute("CALL GetDevices()");
    res.json(data[0]);
  } catch (err) {
    console.error("Failed to fetch devices:", err);
    res.status(500).json({ error: "Failed to fetch devices" });
  }
});

app.get("/api/landing/shelves", async (req, res) => {
  try {
    const [literatureResult, mediaResult, devicesResult] = await Promise.all([
      db.execute("CALL GetLiterature()"),
      db.execute("CALL GetMedia()"),
      db.execute("CALL GetDevices()"),
    ]);

    const literature = Array.isArray(literatureResult[0]?.[0])
      ? literatureResult[0][0]
      : [];
    const media = Array.isArray(mediaResult[0]?.[0]) ? mediaResult[0][0] : [];
    const devices = Array.isArray(devicesResult[0]?.[0])
      ? devicesResult[0][0]
      : [];

    const literatureShelf = buildShelf(
      literature.map((item) => ({
        id: item.ItemID,
        title: item.Title,
        badge: ITEM_TYPE_LABELS.literature[item.ItemType] || "Literature",
        detail: item.Author || item.Publisher || "Library pick",
        availableCopies: item.AvailableCopies,
      })),
      SHELF_IMAGE_INDEXES.literature,
      (record) => record.title
    ).map((record) => ({
      id: record.id,
      title: record.title,
      badge: record.badge,
      detail: record.detail,
      availableCopies: record.availableCopies,
      imageUrl: buildAssetUrl(req, "literature", record.fileName),
    }));

    const mediaShelf = buildShelf(
      media.map((item) => ({
        id: item.ItemID,
        title: item.Title,
        badge: ITEM_TYPE_LABELS.media[item.ItemType] || "Media",
        detail: item.Producer || "Screening room pick",
        availableCopies: item.AvailableCopies,
      })),
      SHELF_IMAGE_INDEXES.media,
      (record) => record.title
    ).map((record) => ({
      id: record.id,
      title: record.title,
      badge: record.badge,
      detail: record.detail,
      availableCopies: record.availableCopies,
      imageUrl: buildAssetUrl(req, "media", record.fileName),
    }));

    const devicesShelf = buildShelf(
      devices.map((item) => ({
        id: item.ItemID,
        title: item.Title,
        badge: ITEM_TYPE_LABELS.devices[item.ItemType] || "Device",
        detail: [item.Manufacturer, item.Model].filter(Boolean).join(" • "),
        availableCopies: item.AvailableCopies,
        imageKey: [item.Manufacturer, item.Model].filter(Boolean).join(","),
      })),
      SHELF_IMAGE_INDEXES.devices,
      (record) => record.imageKey
    ).map((record) => ({
      id: record.id,
      title: record.title,
      badge: record.badge,
      detail: record.detail || "Campus device",
      availableCopies: record.availableCopies,
      imageUrl: buildAssetUrl(req, "devices", record.fileName),
    }));

    res.json({
      literature: literatureShelf,
      media: mediaShelf,
      devices: devicesShelf,
    });
  } catch (err) {
    console.error("Failed to fetch landing shelves:", err);
    res.status(500).json({ error: "Failed to fetch landing shelves" });
  }
});

app.get("/api/title", async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: "Not logged in" });
    }

    const selectedItem = req.session.user.SelectedItem;

    if (!selectedItem) {
        return res.status(400).json({ error: "No item selected" });
    }

    const [data] = await db.execute("CALL getTitle(?)", [selectedItem]);

    res.json(data);
});

// Delete a literature item via DeleteLiterature
app.delete("/api/librarian/catalog/literature/:id", requireLibrarian, async (req, res) => {
    const { id } = req.params;
    try {
        await db.execute("CALL DeleteLiterature(?)", [id]);
        res.json({ message: "Literature deleted" });
    } catch (err) {
        console.error(err);
        if (err.sqlState === "45000") return res.status(400).json({ error: err.sqlMessage });
        res.status(500).json({ error: "Failed to delete literature" });
    }
});

// Get all copies for a specific item
app.get("/api/librarian/catalog/:id/copies", requireLibrarian, async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.execute("CALL GetItemCopies(?)", [id]);
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch copies" });
    }
});

// Delete a single copy via DeleteCopy
app.delete("/api/librarian/catalog/copies/:copyId", requireLibrarian, async (req, res) => {
    const { copyId } = req.params;
    try {
        await db.execute("CALL DeleteCopy(?)", [copyId]);
        res.json({ message: "Copy deleted" });
    } catch (err) {
        console.error(err);
        if (err.sqlState === "45000") return res.status(400).json({ error: err.sqlMessage });
        res.status(500).json({ error: "Failed to delete copy" });
    }
});

// Delete a device item via DeleteDevice
app.delete("/api/librarian/catalog/devices/:id", requireLibrarian, async (req, res) => {
    const { id } = req.params;
    try {
        await db.execute("CALL DeleteDevice(?)", [id]);
        res.json({ message: "Device deleted" });
    } catch (err) {
        console.error(err);
        if (err.sqlState === "45000") return res.status(400).json({ error: err.sqlMessage });
        res.status(500).json({ error: "Failed to delete device" });
    }
});

// Add a new device item via AddDevice
app.post("/api/librarian/catalog/devices", requireLibrarian, async (req, res) => {
    const { Title, ItemType, Manufacturer, Model, Copies } = req.body;
    try {
        const [[{ nextID }]] = await db.execute("SELECT COALESCE(MAX(ItemID), 0) + 1 AS nextID FROM items");
        await db.execute("CALL AddDevice(?, ?, ?, ?, ?, ?, ?)",
            [nextID, Title, ItemType, Manufacturer, Model || null, Copies, req.session.user.UserID]);
        res.status(201).json({ message: "Device added" });
    } catch (err) {
        console.error(err);
        if (err.sqlState === "45000") return res.status(400).json({ error: err.sqlMessage });
        res.status(500).json({ error: "Failed to add device" });
    }
});

// Delete a media item via DeleteMedia
app.delete("/api/librarian/catalog/media/:id", requireLibrarian, async (req, res) => {
    const { id } = req.params;
    try {
        await db.execute("CALL DeleteMedia(?)", [id]);
        res.json({ message: "Media deleted" });
    } catch (err) {
        console.error(err);
        if (err.sqlState === "45000") return res.status(400).json({ error: err.sqlMessage });
        res.status(500).json({ error: "Failed to delete media" });
    }
});

// Add a new media item via AddMedia
app.post("/api/librarian/catalog/media", requireLibrarian, async (req, res) => {
    const { Title, ItemType, Producer, DurationMinutes, Copies } = req.body;
    try {
        // Auto-generate ItemID since media has no natural ID like ISBN
        const [[{ nextID }]] = await db.execute("SELECT COALESCE(MAX(ItemID), 0) + 1 AS nextID FROM items");
        await db.execute("CALL AddMedia(?, ?, ?, ?, ?, ?, ?)",
            [nextID, Title, ItemType, Producer, DurationMinutes || null, Copies, req.session.user.UserID]);
        res.status(201).json({ message: "Media added" });
    } catch (err) {
        console.error(err);
        if (err.sqlState === "45000") return res.status(400).json({ error: err.sqlMessage });
        res.status(500).json({ error: "Failed to add media" });
    }
});

// Add a new literature item via AddLiterature
app.post("/api/librarian/catalog/literature", requireLibrarian, async (req, res) => {
    const { ItemID, Title, ItemType, Author, Publisher, PublicationYear, Copies } = req.body;
    try {
        await db.execute("CALL AddLiterature(?, ?, ?, ?, ?, ?, ?, ?)",
            [ItemID, Title, ItemType, Author, Publisher, PublicationYear || null, Copies, req.session.user.UserID]);
        res.status(201).json({ message: "Literature added" });
    } catch (err) {
        console.error(err);
        if (err.sqlState === "45000") return res.status(400).json({ error: err.sqlMessage });
        res.status(500).json({ error: "Failed to add literature" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {console.log(`Server running on port ${PORT}`);
});
