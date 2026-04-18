import express from "express";
import fs from "fs";
import mysql from "mysql2/promise";
import cors from "cors";
import path from "path";
import session from "express-session";
import "dotenv/config";
import path from "path"; // current folder
import { fileURLToPath } from "url"; // current file

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const imageRoot = path.join(__dirname, "SQLserver", "data", "images");
const FEATURED_LIMIT = 6;
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
app.use(express.json());

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

// builds absolute file path using __dirname
app.use("/images", express.static(path.join(__dirname, "SQLserver/data/images")));

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
    rejectUnauthorized: false,
  },
});

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

const FEATURED_IMAGE_INDEXES = {
  items: buildImageIndex("items"),
  devices: buildImageIndex("devices"),
};

function normalizeAvailableCopies(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function buildAssetUrl(req, folderName, fileName) {
  const encodedPath = fileName
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${req.protocol}://${req.get("host")}/library-images/${folderName}/${encodedPath}`;
}

function pickFeaturedRecords(records, imageIndex, getImageKey) {
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
    .slice(0, FEATURED_LIMIT);
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

    if (
      !Password?.trim() ||
      !FirstName?.trim() ||
      !LastName?.trim() ||
      !Email?.trim()
    ) {
      return res.status(400).json({
        error: "First name, last name, email and password are required.",
      });
    }

    await db.execute("CALL CreateUser(?,?,?,?)", [
      Password,
      FirstName,
      LastName,
      Email,
    ]);

    const [rows] = await db.execute(
      "SELECT UserID FROM users WHERE Email = ?",
      [Email]
    );

    res.status(201).json({
      message: "User registered successfully.",
      id: rows[0].UserID,
    });
  } catch (err) {
    console.error("Insert Failed:", err);

    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        error: "A user with that email already exists.",
      });
    }

    if (err.sqlState === "45000") {
      return res.status(400).json({
        error: err.sqlMessage,
      });
    }

    res.status(500).json({ error: "Failed to register user" });
  }
});

/* ================= LOGIN ================= */

app.post("/api/login", async (req, res) => {
  try {
    const { Email, Password } = req.body;

    if (!Email?.trim() || !Password?.trim()) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const [rows] = await db.execute("SELECT * FROM users WHERE Email = ?", [
      Email,
    ]);

    if (rows.length === 0 || rows[0].Password !== Password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = rows[0];

    req.session.user = {
      UserID: user.UserID,
      Email: user.Email,
      FirstName: user.FirstName,
      LastName: user.LastName,
      UserType: user.UserType,
    };

    req.session.save((err) => {
      if (err) {
        return res.status(500).json({ error: "Session save failed" });
      }

      res.json({
        success: true,
        user: req.session.user,
      });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ================= AUTH ================= */

app.get("/api/me", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ loggedIn: false });
  }

  return res.json({
    loggedIn: true,
    user: req.session.user,
  });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout failed:", err);
      return res.status(500).json({
        success: false,
        message: "Logout failed",
      });
    }

    res.clearCookie("connect.sid");
    return res.json({
      success: true,
      message: "Logged out",
    });
  });
});

/* ================= CHECKOUT AND HOLD ================= */

app.post("/api/checkout", requireLogin, async (req, res) => {
  try {
    const userID = req.session.user.UserID;
    const { itemId } = req.body;

    if (!itemId) {
      return res.status(400).json({ error: "No item selected" });
    }

    await db.execute("CALL CheckoutItem(?, ?)", [userID, itemId]);

    res.json({
      success: true,
      message: "Item checked out",
    });
  } catch (err) {
    handleSqlError(res, err, err.sqlMessage || "Checkout failed");
  }
});

app.post("/api/hold", requireLogin, async (req, res) => {
  try {
    const userID = req.session.user.UserID;
    const { itemId } = req.body;

    if (!itemId) {
      return res.status(400).json({ error: "No item selected" });
    }

    await db.execute("CALL CreateHold(?, ?)", [userID, itemId]);

    res.json({
      success: true,
      message: "Hold placed",
    });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Already holding this item" });
    }

    if (err.sqlState === "45000") {
      return res.status(409).json({ error: err.sqlMessage });
    }

    console.error(err);
    res.status(500).json({ error: "Hold failed" });
  }
});

/* ================= LIBRARIAN: USERS ================= */

app.get("/api/librarian/users", requireLibrarian, async (req, res) => {
  try {
    const [rows] = await db.execute("CALL GetUsers()");
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

app.post("/api/librarian/users", requireLibrarian, async (req, res) => {
  try {
    const { Password, FirstName, LastName, Email, UserType } = req.body;

    if (
      !Password?.trim() ||
      !FirstName?.trim() ||
      !LastName?.trim() ||
      !Email?.trim()
    ) {
      return res.status(400).json({
        error: "First name, last name, email, and password are required.",
      });
    }

    const userType = Number(UserType) || 0;
    const librarianID = req.session.user.UserID;

    await db.execute("CALL AddUser(?, ?, ?, ?, ?, ?)", [
      Password,
      FirstName,
      LastName,
      Email,
      userType,
      librarianID,
    ]);

    const [rows] = await db.execute(
      "SELECT UserID FROM users WHERE Email = ?",
      [Email]
    );

    res.status(201).json({
      message: "User added",
      id: rows[0].UserID,
    });
  } catch (err) {
    console.error(err);

    if (err.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ error: "A user with that email already exists" });
    }

    if (err.sqlState === "45000") {
      return res.status(400).json({ error: err.sqlMessage });
    }

    res.status(500).json({ error: "Failed to add user" });
  }
});

// Update a user via UpdateUser
app.put("/api/librarian/users/:id", requireLibrarian, async (req, res) => {
    try {
        const userId = Number(req.params.id);

        if (userId === req.session.user.UserID) {
            return res.status(400).json({ error: "Cannot edit your own account" });
        }

        const { FirstName, LastName, Email, UserType, Status } = req.body;

        if (!FirstName?.trim() || !LastName?.trim() || !Email?.trim()) {
            return res.status(400).json({ error: "First name, last name, and email are required." });
        }

        await db.execute("CALL UpdateUser(?, ?, ?, ?, ?, ?, ?)", [
            userId, FirstName, LastName, Email,
            Number(UserType), Number(Status), req.session.user.UserID
        ]);

        res.json({ message: "User updated" });
    } catch (err) {
        console.error(err);
        if (err.code === "ER_DUP_ENTRY") return res.status(409).json({ error: "A user with that email already exists" });
        if (err.sqlState === "45000") return res.status(400).json({ error: err.sqlMessage });
        res.status(500).json({ error: "Failed to update user" });
    }
});

// Delete a user via DeleteUser (prevents deletion if there are fines, loans, or holds active)
app.delete("/api/librarian/users/:id", requireLibrarian, async (req, res) => {
  try {
    const userId = Number(req.params.id);

    if (userId === req.session.user.UserID) {
      return res
        .status(400)
        .json({ error: "Cannot delete your own account" });
    }

    await db.execute("CALL DeleteUser(?)", [userId]);

    res.json({ message: "User deleted" });
  } catch (err) {
    console.error(err);

    if (err.sqlState === "45000") {
      return res.status(409).json({ error: err.sqlMessage });
    }

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
    console.error("Failed to fetch literature:", err);
    res.status(500).json({ error: "Failed to fetch literature" });
  }
});

app.get("/api/media", async (req, res) => {
  try {
    const [data] = await db.execute("CALL GetMedia()");
    res.json(data[0]);
  } catch (err) {
    console.error("Failed to fetch media:", err);
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

app.get("/api/landing/featured", async (req, res) => {
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

    const featuredItems = pickFeaturedRecords(
      [
        ...literature.map((item) => ({
          id: item.ItemID,
          title: item.Title,
          category: "Literature",
          badge: ITEM_TYPE_LABELS.literature[item.ItemType] || "Literature",
          detail: item.Author || item.Publisher || "Library favorite",
          availableCopies: item.AvailableCopies,
        })),
        ...media.map((item) => ({
          id: item.ItemID,
          title: item.Title,
          category: "Media",
          badge: ITEM_TYPE_LABELS.media[item.ItemType] || "Media",
          detail: item.Producer || "Screening room pick",
          availableCopies: item.AvailableCopies,
        })),
      ],
      FEATURED_IMAGE_INDEXES.items,
      (record) => record.title
    ).map((record) => ({
      id: record.id,
      title: record.title,
      category: record.category,
      badge: record.badge,
      detail: record.detail,
      availableCopies: record.availableCopies,
      imageUrl: buildAssetUrl(req, "items", record.fileName),
    }));

    const featuredDevices = pickFeaturedRecords(
      devices.map((item) => ({
        id: item.ItemID,
        title: item.Title,
        category: "Devices",
        badge: ITEM_TYPE_LABELS.devices[item.ItemType] || "Device",
        detail: [item.Manufacturer, item.Model].filter(Boolean).join(" • "),
        availableCopies: item.AvailableCopies,
        imageKey: [item.Manufacturer, item.Model].filter(Boolean).join(","),
      })),
      FEATURED_IMAGE_INDEXES.devices,
      (record) => record.imageKey
    ).map((record) => ({
      id: record.id,
      title: record.title,
      category: record.category,
      badge: record.badge,
      detail: record.detail || "Campus device",
      availableCopies: record.availableCopies,
      imageUrl: buildAssetUrl(req, "devices", record.fileName),
    }));

    res.json({
      items: featuredItems,
      devices: featuredDevices,
    });
  } catch (err) {
    console.error("Failed to fetch landing dashboard content:", err);
    res.status(500).json({ error: "Failed to fetch landing dashboard content" });
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

// Update a literature item via UpdateLiterature
app.put("/api/librarian/catalog/literature/:id", requireLibrarian, async (req, res) => {
    const { id } = req.params;
    const { Title, ItemType, Author, Publisher, PublicationYear } = req.body;
    try {
        await db.execute("CALL UpdateLiterature(?, ?, ?, ?, ?, ?, ?)", [
            id, Title, Number(ItemType), Author, Publisher,
            PublicationYear ? Number(PublicationYear) : null,
            req.session.user.UserID
        ]);
        res.json({ message: "Literature updated" });
    } catch (err) {
        console.error(err);
        if (err.sqlState === "45000") return res.status(400).json({ error: err.sqlMessage });
        res.status(500).json({ error: "Failed to update literature" });
    }
});

// Delete a literature item via DeleteLiterature
app.delete("/api/librarian/catalog/literature/:id", requireLibrarian, async (req, res) => {
    const { id } = req.params;
    try {
      await db.execute("CALL DeleteLiterature(?)", [req.params.id]);
      res.json({ message: "Literature deleted" });
    } catch (err) {
      console.error(err);
      if (err.sqlState === "45000") {
        return res.status(400).json({ error: err.sqlMessage });
      }
      res.status(500).json({ error: "Failed to delete literature" });
    }
  }
);

app.get(
  "/api/librarian/catalog/:id/copies",
  requireLibrarian,
  async (req, res) => {
    try {
      const [rows] = await db.execute("CALL GetItemCopies(?)", [req.params.id]);
      res.json(rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch copies" });
    }
});

// Add a single copy to an existing item via AddCopy
app.post("/api/librarian/catalog/copies", requireLibrarian, async (req, res) => {
    const { ItemID } = req.body;
    try {
        await db.execute("CALL AddCopy(?, ?, ?)", [ItemID, 0, req.session.user.UserID]);
        res.status(201).json({ message: "Copy added" });
    } catch (err) {
        console.error(err);
        if (err.sqlState === "45000") return res.status(400).json({ error: err.sqlMessage });
        res.status(500).json({ error: "Failed to add copy" });
    }
});

app.delete(
  "/api/librarian/catalog/copies/:copyId",
  requireLibrarian,
  async (req, res) => {
    try {
      await db.execute("CALL DeleteCopy(?)", [req.params.copyId]);
      res.json({ message: "Copy deleted" });
    } catch (err) {
      console.error(err);
      if (err.sqlState === "45000") {
        return res.status(400).json({ error: err.sqlMessage });
      }
      res.status(500).json({ error: "Failed to delete copy" });
    }
});

// Update a device item via UpdateDevice
app.put("/api/librarian/catalog/devices/:id", requireLibrarian, async (req, res) => {
    const { id } = req.params;
    const { Title, ItemType, Manufacturer, Model } = req.body;
    try {
        await db.execute("CALL UpdateDevice(?, ?, ?, ?, ?, ?)", [
            id, Title, Number(ItemType), Manufacturer, Model || null,
            req.session.user.UserID
        ]);
        res.json({ message: "Device updated" });
    } catch (err) {
        console.error(err);
        if (err.sqlState === "45000") return res.status(400).json({ error: err.sqlMessage });
        res.status(500).json({ error: "Failed to update device" });
    }
});

app.delete(
  "/api/librarian/catalog/devices/:id",
  requireLibrarian,
  async (req, res) => {
    try {
      await db.execute("CALL DeleteDevice(?)", [req.params.id]);
      res.json({ message: "Device deleted" });
    } catch (err) {
      console.error(err);
      if (err.sqlState === "45000") {
        return res.status(400).json({ error: err.sqlMessage });
      }
      res.status(500).json({ error: "Failed to delete device" });
    }
  }
);

app.post(
  "/api/librarian/catalog/devices",
  requireLibrarian,
  async (req, res) => {
    try {
      const { Title, ItemType, Manufacturer, Model, Copies } = req.body;

      const [[{ nextID }]] = await db.execute(
        "SELECT COALESCE(MAX(ItemID), 0) + 1 AS nextID FROM items"
      );

      await db.execute("CALL AddDevice(?, ?, ?, ?, ?, ?, ?)", [
        nextID,
        Title,
        ItemType,
        Manufacturer,
        Model || null,
        Copies,
        req.session.user.UserID,
      ]);

      res.status(201).json({ message: "Device added" });
    } catch (err) {
      console.error(err);
      if (err.sqlState === "45000") {
        return res.status(400).json({ error: err.sqlMessage });
      }
      res.status(500).json({ error: "Failed to add device" });
    }
});

// Update a media item via UpdateMedia
app.put("/api/librarian/catalog/media/:id", requireLibrarian, async (req, res) => {
    const { id } = req.params;
    const { Title, ItemType, Producer, DurationMinutes } = req.body;
    try {
        await db.execute("CALL UpdateMedia(?, ?, ?, ?, ?, ?)", [
            id, Title, Number(ItemType), Producer,
            DurationMinutes ? Number(DurationMinutes) : null,
            req.session.user.UserID
        ]);
        res.json({ message: "Media updated" });
    } catch (err) {
        console.error(err);
        if (err.sqlState === "45000") return res.status(400).json({ error: err.sqlMessage });
        res.status(500).json({ error: "Failed to update media" });
    }
});

app.delete(
  "/api/librarian/catalog/media/:id",
  requireLibrarian,
  async (req, res) => {
    try {
      await db.execute("CALL DeleteMedia(?)", [req.params.id]);
      res.json({ message: "Media deleted" });
    } catch (err) {
      console.error(err);
      if (err.sqlState === "45000") {
        return res.status(400).json({ error: err.sqlMessage });
      }
      res.status(500).json({ error: "Failed to delete media" });
    }
  }
);

app.post(
  "/api/librarian/catalog/media",
  requireLibrarian,
  async (req, res) => {
    try {
      const { Title, ItemType, Producer, DurationMinutes, Copies } = req.body;

      const [[{ nextID }]] = await db.execute(
        "SELECT COALESCE(MAX(ItemID), 0) + 1 AS nextID FROM items"
      );

      await db.execute("CALL AddMedia(?, ?, ?, ?, ?, ?, ?)", [
        nextID,
        Title,
        ItemType,
        Producer,
        DurationMinutes || null,
        Copies,
        req.session.user.UserID,
      ]);

      res.status(201).json({ message: "Media added" });
    } catch (err) {
      console.error(err);
      if (err.sqlState === "45000") {
        return res.status(400).json({ error: err.sqlMessage });
      }
      res.status(500).json({ error: "Failed to add media" });
    }
  }
);

app.post(
  "/api/librarian/catalog/literature",
  requireLibrarian,
  async (req, res) => {
    try {
      const {
        ItemID,
        Title,
        ItemType,
        Author,
        Publisher,
        PublicationYear,
        Copies,
      } = req.body;

      await db.execute("CALL AddLiterature(?, ?, ?, ?, ?, ?, ?, ?)", [
        ItemID,
        Title,
        ItemType,
        Author,
        Publisher,
        PublicationYear || null,
        Copies,
        req.session.user.UserID,
      ]);

      res.status(201).json({ message: "Literature added" });
    } catch (err) {
      console.error(err);
      if (err.sqlState === "45000") {
        return res.status(400).json({ error: err.sqlMessage });
      }
      res.status(500).json({ error: "Failed to add literature" });
    }
  }
);

/* ================= ANALYTICS ================= */

app.get("/api/librarian/overview/stats", requireLibrarian, async (_req, res) => {
  try {
    const [data] = await db.execute("CALL GetOverviewStats()");
    res.json(data[0][0]);
  } catch (err) {
    console.error("Failed to fetch overview stats:", err);
    res.status(500).json({ error: "Failed to fetch overview stats" });
  }
});

app.get("/api/librarian/analytics/summary", requireLibrarian, async (_req, res) => {
  try {
    const [data] = await db.execute("CALL GetAnalyticsSummary()");
    res.json(data[0][0]);
  } catch (err) {
    console.error("Failed to fetch analytics summary:", err);
    res.status(500).json({ error: "Failed to fetch analytics summary" });
  }
});

app.get("/api/librarian/analytics/most-checked-out", requireLibrarian, async (req, res) => {
  const { startDate, endDate, category, itemType } = req.query;
  try {
    const [data] = await db.execute("CALL GetMostCheckedOut(?, ?, ?, ?)", [
      startDate || null,
      endDate   || null,
      category  ? Number(category)  : null,
      itemType  ? Number(itemType)  : null,
    ]);
    res.json(data[0]);
  } catch (err) {
    console.error("Failed to fetch analytics:", err);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});


/* ================= LIBRARIAN: FINES ================= */

app.get("/api/librarian/fines", requireLibrarian, async (req, res) => {
  try {
    const [rows] = await db.execute("CALL GetFines()");
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch fines" });
  }
});

app.get("/api/librarian/fines/paid", requireLibrarian, async (req, res) => {
  try {
    const [rows] = await db.execute("CALL GetPaidFines()");
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch paid fines" });
  }
});

app.get("/api/librarian/fines/unpaid", requireLibrarian, async (req, res) => {
  try {
    const [rows] = await db.execute("CALL GetUnpaidFines()");
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch unpaid fines" });
  }
});

/* ================ USER TRANSACTIONS ================= */
app.get("/api/user/balance", requireLogin, async (req, res) => {
  try {
    const userId = req.session.user.UserID;

    const [rows] = await db.execute("CALL GetUserBalance(?)", [userId]);

    // rows[0][0] because MySQL returns nested arrays for procedures
    const balance = rows[0][0]?.Balance ?? 0;

    res.json({ Balance: Number(balance) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch balance" });
  }
});

app.put("/api/finepayment", requireLogin, async (req, res) => {
  try {
    const userId = req.session.user.UserID;

    await db.execute("CALL PayFine(?)", [userId]);

    res.json({
      success: true,
      message: "All unpaid fines paid successfully"
    });
  } catch (err) {
    handleSqlError(res, err, err.sqlMessage || "Payment failed");
  }
});

// ================ USER LOANS =================
app.get("/api/user/loans", requireLogin, async (req, res) => {
  try {
    const userId = req.session.user.UserID;
    const [data] = await db.execute("CALL GetUserLoans(?)", [userId]);
    res.json(data[0]);
  } catch (err) {
    console.error("Failed to fetch user loans:", err);
    res.status(500).json({ error: "Failed to fetch loans" });
  }
});

// ================ USER HOLDS =================
app.get("/api/user/holds", requireLogin, async (req, res) => {
  try {
    const userId = req.session.user.UserID;
    const [data] = await db.execute("CALL GetUserHolds(?)", [userId]);
    res.json(data[0]);
  } catch (err) {
    console.error("Failed to fetch user holds:", err);
    res.status(500).json({ error: "Failed to fetch holds" });
  }
});

app.post("/api/user/loans/:loanId/return", requireLogin, async (req, res) => {
  try {
    const userId = req.session.user.UserID;
    const loanId = parseInt(req.params.loanId);
    await db.execute("CALL ReturnLoan(?, ?)", [loanId, userId]);
    res.json({ success: true });
  } catch (err) {
    handleSqlError(res, err, err.sqlMessage || "Failed to return loan");
  }
});

// ================ LOANS =================
app.get("/api/librarian/loans/active", requireLibrarian, async (req, res) => {
  try {
    const [data] = await db.execute("CALL GetActiveLoans()");
    res.json(data[0]);
  } catch (err) {
    console.error("Failed to fetch active loans:", err);
    res.status(500).json({ error: "Failed to fetch active loans" });
  }
});

app.get("/api/librarian/loans/overdue", requireLibrarian, async (req, res) => {
  try {
    const [data] = await db.execute("CALL GetOverdueLoans()");
    res.json(data[0]);
  } catch (err) {
    console.error("Failed to fetch overdue loans:", err);
    res.status(500).json({ error: "Failed to fetch overdue loans" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Returns a loaned copy via ReturnLoan (librarians only, requires loanId in body)
app.post('/api/loans/return', async (req, res) => {
  try {
    const { loanId } = req.body;

    if (!req.session || !req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const processedBy = req.session.user.UserID;
    const userType = req.session.user.UserType;

    if (!loanId) {
      return res.status(400).json({ error: 'loanId is required' });
    }

    if (userType !== 2) {
      return res.status(403).json({ error: 'Only librarians can process returns' });
    }

    await db.promise().query('CALL ReturnLoan(?, ?)', [loanId, processedBy]);

    res.json({
      success: true,
      message: 'Return processed successfully'
    });
  } catch (err) {
    console.error('Return route error:', err);
    res.status(500).json({
      error: err.sqlMessage || 'Failed to process return'
    });
  }
});


// ================ NOTIFICATIONS =================
// Get current user's notifications
app.get("/api/notifications", requireLogin, async (req, res) => {
  try {
    const userId = req.session.user.UserID;

    const [data] = await db.execute(
      "CALL GetUserNotifications(?)",
      [userId]
    );

    res.json(data[0]);
  } catch (err) {
    console.error("Failed to fetch notifications:", err);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// Mark notification as read
app.post('/api/notifications/read', async (req, res) => {
  try {
    const { notificationId } = req.body;

    if (!req.session || !req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!notificationId) {
      return res.status(400).json({ error: 'notificationId is required' });
    }

    await db.promise().query('CALL MarkNotificationRead(?)', [notificationId]);

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (err) {
    console.error('Mark notification read error:', err);
    res.status(500).json({
      error: err.sqlMessage || 'Failed to update notification'
    });
  }
});
