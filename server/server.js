import { createApp } from "./routing.js";
import fs from "fs";
import mysql from "mysql2/promise";
import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";

const app = createApp();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const imageRoot = path.join(__dirname, "SQLserver", "data", "images");
const IMAGE_FOLDERS = new Set([
  "devices",
  "items",
  "literature",
  "media",
]);
const IMAGE_CONTENT_TYPES = {
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

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

/* =========================================================
   GLOBAL CORS FIX (THIS IS WHAT WAS BREAKING EVERYTHING)
   ========================================================= */

const ALLOWED_ORIGIN = "http://localhost:5173";

function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,DELETE,OPTIONS"
  );
}

/* If routing.js supports middleware, this will run for all requests */
app.use?.((req, res, next) => {
  setCorsHeaders(res);

  // Preflight handling
  if (req.method === "OPTIONS") {
    return res.status?.(204)?.end?.() || res.end();
  }

  next?.();
});

/* fallback safety: if middleware is NOT supported */
const originalListen = app.listen;
app.listen = function (...args) {
  console.log("CORS patch active (fallback mode)");
  return originalListen.apply(app, args);
};

/* ================= BASIC ROUTES ================= */

app.get("/", (req, res) => {
  setCorsHeaders(res);
  res.send("Backend is running");
});

app.get("/health", (req, res) => {
  setCorsHeaders(res);
  res.status(200).send("ok");
});

app.get("/library-images/:folder/:fileName", (req, res) => {
  const { folder, fileName } = req.params;

  if (!IMAGE_FOLDERS.has(folder)) {
    return res.status(404).json({ error: "Image not found" });
  }

  let decodedFileName;

  try {
    decodedFileName = decodeURIComponent(fileName);
  } catch {
    return res.status(400).json({ error: "Invalid image path" });
  }

  if (
    decodedFileName.includes("/") ||
    decodedFileName.includes("\\")
  ) {
    return res.status(400).json({ error: "Invalid image path" });
  }

  const folderPath = path.resolve(imageRoot, folder);
  const filePath = path.resolve(folderPath, decodedFileName);
  const relativePath = path.relative(folderPath, filePath);

  if (
    relativePath.startsWith("..") ||
    path.isAbsolute(relativePath) ||
    !fs.existsSync(filePath) ||
    !fs.statSync(filePath).isFile()
  ) {
    return res.status(404).json({ error: "Image not found" });
  }

  const contentType =
    IMAGE_CONTENT_TYPES[path.extname(filePath).toLowerCase()] ||
    "application/octet-stream";

  res.setHeader("Content-Type", contentType);
  fs.createReadStream(filePath).pipe(res);
});

/* ================= DB ================= */

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

function buildAssetUrl(folderName, fileName) {
  const encodedPath = fileName
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `/library-images/${folderName}/${encodedPath}`;
}

function pickFeaturedRecords(records, imageIndex, getImageKey) {
  return records
    .map((record) => {
      const fileName = imageIndex.get(getImageKey(record));

      if (!fileName) return null;

      return {
        ...record,
        availableCopies: normalizeAvailableCopies(record.availableCopies),
        fileName,
      };
    })
    .filter(Boolean)
    .sort(
      (a, b) =>
        b.availableCopies - a.availableCopies ||
        a.title.localeCompare(b.title)
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

/* ================= AUTH HELPERS ================= */

function requireLogin(req, res, next) {
  setCorsHeaders(res);

  if (!req.session?.user) {
    return res.status(401).json({ error: "Not logged in" });
  }
  next();
}

function requireLibrarian(req, res, next) {
  setCorsHeaders(res);

  if (!req.session?.user) {
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
    setCorsHeaders(res);

    const { Password, FirstName, LastName, Email } = req.body;

    if (!Password || !FirstName || !LastName || !Email) {
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
    handleSqlError(res, err, "Failed to register user");
  }
});

/* ================= LOGIN ================= */

app.post("/api/login", async (req, res) => {
  try {
    setCorsHeaders(res);

    const { Email, Password } = req.body;

    if (!Email || !Password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const [rows] = await db.execute("SELECT * FROM users WHERE Email = ?", [
      Email,
    ]);

    if (rows.length === 0 || rows[0].Password !== Password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    req.session.user = {
      UserID: rows[0].UserID,
      Email: rows[0].Email,
      FirstName: rows[0].FirstName,
      LastName: rows[0].LastName,
      UserType: rows[0].UserType,
    };

    res.json({ success: true, user: req.session.user });
  } catch (err) {
    setCorsHeaders(res);
    res.status(500).json({ error: "Server error" });
  }
});
/* ================= AUTH ================= */

app.get("/api/me", (req, res) => {
  if (!req.session?.user) {
    return res.status(401).json({ loggedIn: false });
  }

  return res.json({
    loggedIn: true,
    user: req.session.user,
  });
});

app.post("/api/logout", (req, res) => {
  // FIXED: no destroy, just clear object
  req.session.user = null;

  return res.json({
    success: true,
    message: "Logged out",
  });
});

/* ================= CHECKOUT ================= */

app.post("/api/checkout", requireLogin, async (req, res) => {
  try {
    const userID = req.session.user.UserID;
    const { itemId } = req.body;

    if (!itemId) {
      return res.status(400).json({ error: "No item selected" });
    }

    await db.execute("CALL CheckoutItem(?, ?)", [userID, itemId]);

    res.json({ success: true, message: "Item checked out" });
  } catch (err) {
    handleSqlError(res, err, "Checkout failed");
  }
});

/* ================= HOLD ================= */

app.post("/api/hold", requireLogin, async (req, res) => {
  try {
    const userID = req.session.user.UserID;
    const { itemId } = req.body;

    if (!itemId) {
      return res.status(400).json({ error: "No item selected" });
    }

    await db.execute("CALL CreateHold(?, ?)", [userID, itemId]);

    res.json({ success: true, message: "Hold placed" });
  } catch (err) {
    handleSqlError(res, err, "Hold failed");
  }
});

/* ================= LIBRARIAN USERS ================= */

app.get("/api/librarian/users", requireLibrarian, async (req, res) => {
  try {
    const [rows] = await db.execute("CALL GetUsers()");
    res.json(rows[0]);
  } catch (err) {
    handleSqlError(res, err, "Failed to fetch users");
  }
});

app.post("/api/librarian/users", requireLibrarian, async (req, res) => {
  try {
    const { Password, FirstName, LastName, Email, UserType } = req.body;

    if (!Password || !FirstName || !LastName || !Email) {
      return res.status(400).json({ error: "Missing fields" });
    }

    await db.execute("CALL AddUser(?, ?, ?, ?, ?, ?)", [
      Password,
      FirstName,
      LastName,
      Email,
      Number(UserType) || 0,
      req.session.user.UserID,
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
    handleSqlError(res, err, "Failed to add user");
  }
});

app.put(
  "/api/librarian/users/:id",
  requireLibrarian,
  async (req, res) => {
    try {
      const userId = Number(req.params.id);

      if (userId === req.session.user.UserID) {
        return res
          .status(400)
          .json({ error: "Cannot edit your own account" });
      }

      const { FirstName, LastName, Email, UserType, Status } = req.body;

      if (!FirstName?.trim() || !LastName?.trim() || !Email?.trim()) {
        return res.status(400).json({
          error: "First name, last name, and email are required.",
        });
      }

      await db.execute("CALL UpdateUser(?, ?, ?, ?, ?, ?, ?)", [
        userId,
        FirstName,
        LastName,
        Email,
        Number(UserType),
        Number(Status),
        req.session.user.UserID,
      ]);

      res.json({ message: "User updated" });
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

      res.status(500).json({ error: "Failed to update user" });
    }
  }
);

/* ================= DELETE USER ================= */

app.delete(
  "/api/librarian/users/:id",
  requireLibrarian,
  async (req, res) => {
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
  }
);

/* ================= DATA ================= */

app.get("/api/literature", async (req, res) => {
  try {
    const [data] = await db.execute("CALL GetLiterature()");
    res.json(data[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch literature" });
  }
});

app.get("/api/media", async (req, res) => {
  try {
    const [data] = await db.execute("CALL GetMedia()");
    res.json(data[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch media" });
  }
});

app.get("/api/devices", async (req, res) => {
  try {
    const [data] = await db.execute("CALL GetDevices()");
    res.json(data[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch devices" });
  }
});

/* ================= FEATURED ================= */

app.get("/api/landing/featured", async (req, res) => {
  try {
    const [literatureResult, mediaResult, devicesResult] =
      await Promise.all([
        db.execute("CALL GetLiterature()"),
        db.execute("CALL GetMedia()"),
        db.execute("CALL GetDevices()"),
      ]);

    const literature = Array.isArray(literatureResult[0]?.[0])
      ? literatureResult[0][0]
      : [];

    const media = Array.isArray(mediaResult[0]?.[0])
      ? mediaResult[0][0]
      : [];

    const devices = Array.isArray(devicesResult[0]?.[0])
      ? devicesResult[0][0]
      : [];

    const featuredItems = pickFeaturedRecords(
      [
        ...literature.map((item) => ({
          id: item.ItemID,
          title: item.Title,
          category: "Literature",
          badge:
            ITEM_TYPE_LABELS.literature[item.ItemType] || "Literature",
          detail:
            item.Author || item.Publisher || "Library favorite",
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
      imageUrl: buildAssetUrl("items", record.fileName),
    }));

    const featuredDevices = pickFeaturedRecords(
      devices.map((item) => ({
        id: item.ItemID,
        title: item.Title,
        category: "Devices",
        badge:
          ITEM_TYPE_LABELS.devices[item.ItemType] || "Device",
        detail: [item.Manufacturer, item.Model]
          .filter(Boolean)
          .join(" • "),
        availableCopies: item.AvailableCopies,
        imageKey: [item.Manufacturer, item.Model]
          .filter(Boolean)
          .join(","),
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
      imageUrl: buildAssetUrl("devices", record.fileName),
    }));

    res.json({
      items: featuredItems,
      devices: featuredDevices,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to fetch landing dashboard content",
    });
  }
});

/* ================= TITLE ================= */

app.get("/api/title", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Not logged in" });
  }

  const selectedItem = req.session.user.SelectedItem;

  if (!selectedItem) {
    return res.status(400).json({ error: "No item selected" });
  }

  const [data] = await db.execute("CALL getTitle(?)", [
    selectedItem,
  ]);

  res.json(data);
});

/* ================= CATALOG: COPIES ================= */

app.get(
  "/api/librarian/catalog/:itemID/copies",
  requireLibrarian,
  async (req, res) => {
    try {
      const itemID = Number(req.params.itemID);
      const [rows] = await db.execute("CALL GetItemCopies(?)", [itemID]);
      res.json(rows[0]);
    } catch (err) {
      handleSqlError(res, err, "Failed to fetch copies");
    }
  }
);

app.post(
  "/api/librarian/catalog/copies",
  requireLibrarian,
  async (req, res) => {
    try {
      const itemID = Number(req.body.ItemID);

      await db.execute("CALL AddCopy(?, ?, ?)", [
        itemID,
        0,
        req.session.user.UserID,
      ]);

      res.status(201).json({ message: "Copy added" });
    } catch (err) {
      handleSqlError(res, err, "Failed to add copy");
    }
  }
);

app.delete(
  "/api/librarian/catalog/copies/:copyID",
  requireLibrarian,
  async (req, res) => {
    try {
      const copyID = Number(req.params.copyID);

      await db.execute("CALL DeleteCopy(?)", [copyID]);

      res.json({ message: "Copy deleted" });
    } catch (err) {
      handleSqlError(res, err, "Failed to delete copy");
    }
  }
);

/* ================= CATALOG: DEVICES ================= */

app.post(
  "/api/librarian/catalog/devices",
  requireLibrarian,
  async (req, res) => {
    try {
      const { Title, ItemType, Manufacturer, Model, Copies } = req.body;

      const [[row]] = await db.execute(
        "SELECT COALESCE(MAX(ItemID), 0) + 1 AS nextID FROM items"
      );

      const nextID = row.nextID;

      await db.execute("CALL AddDevice(?, ?, ?, ?, ?, ?, ?)", [
        nextID,
        Title,
        Number(ItemType),
        Manufacturer,
        Model || null,
        Number(Copies) || 0,
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
  }
);

app.put(
  "/api/librarian/catalog/devices/:id",
  requireLibrarian,
  async (req, res) => {
    try {
      const { Title, ItemType, Manufacturer, Model } = req.body;
      await db.execute("CALL UpdateDevice(?, ?, ?, ?, ?, ?)", [
        Number(req.params.id),
        Title,
        Number(ItemType),
        Manufacturer,
        Model || null,
        req.session.user.UserID,
      ]);
      res.json({ message: "Device updated" });
    } catch (err) {
      console.error(err);
      if (err.sqlState === "45000") {
        return res.status(400).json({ error: err.sqlMessage });
      }
      res.status(500).json({ error: "Failed to update device" });
    }
  }
);

app.delete(
  "/api/librarian/catalog/devices/:id",
  requireLibrarian,
  async (req, res) => {
    try {
      await db.execute("CALL DeleteDevice(?)", [Number(req.params.id)]);
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

/* ================= MEDIA ================= */

app.put(
  "/api/librarian/catalog/media/:id",
  requireLibrarian,
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { Title, ItemType, Genre, Producer, DurationMinutes } = req.body;

      await db.execute("CALL UpdateMedia(?, ?, ?, ?, ?, ?, ?)", [
        id,
        Title,
        Number(ItemType),
        Number(Genre) || 0,
        Producer,
        DurationMinutes ? Number(DurationMinutes) : null,
        req.session.user.UserID,
      ]);

      res.json({ message: "Media updated" });
    } catch (err) {
      console.error(err);

      if (err.sqlState === "45000") {
        return res.status(400).json({ error: err.sqlMessage });
      }

      res.status(500).json({ error: "Failed to update media" });
    }
  }
);

app.delete(
  "/api/librarian/catalog/media/:id",
  requireLibrarian,
  async (req, res) => {
    try {
      await db.execute("CALL DeleteMedia(?)", [Number(req.params.id)]);
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
      const {
        Title,
        ItemType,
        Genre,
        Producer,
        DurationMinutes,
        Copies,
      } = req.body;

      const [[row]] = await db.execute(
        "SELECT COALESCE(MAX(ItemID), 0) + 1 AS nextID FROM items"
      );

      const nextID = row.nextID;

      await db.execute("CALL AddMedia(?, ?, ?, ?, ?, ?, ?, ?)", [
        nextID,
        Title,
        Number(ItemType),
        Number(Genre) || 0,
        Producer,
        DurationMinutes ? Number(DurationMinutes) : null,
        Number(Copies) || 0,
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

/* ================= LITERATURE ================= */

app.post(
  "/api/librarian/catalog/literature",
  requireLibrarian,
  async (req, res) => {
    try {
      const {
        ItemID,
        Title,
        ItemType,
        Genre,
        Author,
        Publisher,
        PublicationYear,
        Copies,
      } = req.body;

      await db.execute("CALL AddLiterature(?, ?, ?, ?, ?, ?, ?, ?, ?)", [
        ItemID,
        Title,
        Number(ItemType),
        Number(Genre) || 0,
        Author,
        Publisher,
        PublicationYear ? Number(PublicationYear) : null,
        Number(Copies) || 0,
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

app.put(
  "/api/librarian/catalog/literature/:id",
  requireLibrarian,
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const {
        Title,
        ItemType,
        Genre,
        Author,
        Publisher,
        PublicationYear,
      } = req.body;

      await db.execute("CALL UpdateLiterature(?, ?, ?, ?, ?, ?, ?, ?)", [
        id,
        Title,
        Number(ItemType),
        Number(Genre) || 0,
        Author,
        Publisher,
        PublicationYear ? Number(PublicationYear) : null,
        req.session.user.UserID,
      ]);

      res.json({ message: "Literature updated" });
    } catch (err) {
      console.error(err);

      if (err.sqlState === "45000") {
        return res.status(400).json({ error: err.sqlMessage });
      }

      res.status(500).json({ error: "Failed to update literature" });
    }
  }
);

app.delete(
  "/api/librarian/catalog/literature/:id",
  requireLibrarian,
  async (req, res) => {
    try {
      await db.execute("CALL DeleteLiterature(?)", [Number(req.params.id)]);
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

/* ================= ANALYTICS ================= */

app.get(
  "/api/librarian/overview/stats",
  requireLibrarian,
  async (_req, res) => {
    try {
      const [rows] = await db.execute("CALL GetOverviewStats()");
      res.json(rows[0][0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch overview stats" });
    }
  }
);

app.get(
  "/api/librarian/analytics/summary",
  requireLibrarian,
  async (_req, res) => {
    try {
      const [rows] = await db.execute("CALL GetAnalyticsSummary()");
      res.json(rows[0][0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch analytics summary" });
    }
  }
);

app.get(
  "/api/librarian/analytics/most-checked-out",
  requireLibrarian,
  async (req, res) => {
    try {
      const { startDate, endDate, category, itemType } = req.query;

      const [rows] = await db.execute("CALL GetMostCheckedOut(?, ?, ?, ?)", [
        startDate || null,
        endDate || null,
        category ? Number(category) : null,
        itemType ? Number(itemType) : null,
      ]);

      res.json(rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  }
);

app.get(
  "/api/librarian/analytics/top-librarian",
  requireLibrarian,
  async (_req, res) => {
    try {
      const [rows] = await db.execute("CALL GetTopLibrarian()");
      res.json(rows[0][0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch top librarian" });
    }
  }
);

app.get(
  "/api/librarian/analytics/transactions/summary",
  requireLibrarian,
  async (_req, res) => {
    try {
      const [rows] = await db.execute("CALL GetTransactionSummary()");
      res.json(rows[0][0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch transaction summary" });
    }
  }
);

app.get(
  "/api/librarian/analytics/transactions/report",
  requireLibrarian,
  async (req, res) => {
    try {
      const { startDate, endDate, userId, type } = req.query;

      const [rows] = await db.execute("CALL GetTransactionReport(?, ?, ?, ?)", [
        startDate || null,
        endDate || null,
        userId ? Number(userId) : null,
        type || null,
      ]);

      res.json(rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch transaction report" });
    }
  }
);

/* ================= FINES ================= */

app.get("/api/librarian/fines", requireLibrarian, async (_req, res) => {
  try {
    const [rows] = await db.execute("CALL GetFines()");
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch fines" });
  }
});

app.get("/api/librarian/fines/paid", requireLibrarian, async (_req, res) => {
  try {
    const [rows] = await db.execute("CALL GetPaidFines()");
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch paid fines" });
  }
});

app.get("/api/librarian/fines/unpaid", requireLibrarian, async (_req, res) => {
  try {
    const [rows] = await db.execute("CALL GetUnpaidFines()");
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch unpaid fines" });
  }
});

/* ================= USER BALANCE ================= */

app.get("/api/user/balance", requireLogin, async (req, res) => {
  try {
    const userId = req.session.user.UserID;

    const [rows] = await db.execute("CALL GetUserBalance(?)", [userId]);

    const balance = rows?.[0]?.[0]?.Balance ?? 0;

    res.json({ Balance: Number(balance) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch balance" });
  }
});

/* ================= FINE PAYMENT ================= */

app.put("/api/finepayment", requireLogin, async (req, res) => {
  try {
    const userId = req.session.user.UserID;

    await db.execute("CALL PayFine(?)", [userId]);

    res.json({
      success: true,
      message: "All unpaid fines paid successfully",
    });
  } catch (err) {
    console.error(err);
    handleSqlError(res, err, err.sqlMessage || "Payment failed");
  }
});

/* ================= USER LOANS ================= */

app.get("/api/user/loans", requireLogin, async (req, res) => {
  try {
    const userId = req.session.user.UserID;

    const [rows] = await db.execute("CALL GetUserLoans(?)", [userId]);

    res.json(rows[0]);
  } catch (err) {
    console.error("Failed to fetch user loans:", err);
    res.status(500).json({ error: "Failed to fetch loans" });
  }
});

/* ================= USER HOLDS ================= */

app.get("/api/user/holds", requireLogin, async (req, res) => {
  try {
    const userId = req.session.user.UserID;

    const [rows] = await db.execute("CALL GetUserHolds(?)", [userId]);

    res.json(rows[0]);
  } catch (err) {
    console.error("Failed to fetch user holds:", err);
    res.status(500).json({ error: "Failed to fetch holds" });
  }
});

/* ================= LIBRARIAN LOANS ================= */

app.get("/api/librarian/holds/active", requireLibrarian, async (_req, res) => {
  try {
    const [rows] = await db.execute("CALL GetAllActiveHolds()");
    res.json(rows[0]);
  } catch (err) {
    console.error("Failed to fetch active holds:", err);
    res.status(500).json({ error: "Failed to fetch active holds" });
  }
});

app.get("/api/librarian/holds/fulfilled", requireLibrarian, async (_req, res) => {
  try {
    const [rows] = await db.execute("CALL GetFulfilledHolds()");
    res.json(rows[0]);
  } catch (err) {
    console.error("Failed to fetch fulfilled holds:", err);
    res.status(500).json({ error: "Failed to fetch fulfilled holds" });
  }
});

app.get("/api/librarian/loans/active", requireLibrarian, async (_req, res) => {
  try {
    const [rows] = await db.execute("CALL GetActiveLoans()");
    res.json(rows[0]);
  } catch (err) {
    console.error("Failed to fetch active loans:", err);
    res.status(500).json({ error: "Failed to fetch active loans" });
  }
});

app.get("/api/librarian/loans/overdue", requireLibrarian, async (_req, res) => {
  try {
    const [rows] = await db.execute("CALL GetOverdueLoans()");
    res.json(rows[0]);
  } catch (err) {
    console.error("Failed to fetch overdue loans:", err);
    res.status(500).json({ error: "Failed to fetch overdue loans" });
  }
});

app.get("/api/librarian/loans/returned", requireLibrarian, async (_req, res) => {
  try {
    const [rows] = await db.execute("CALL GetReturnedLoans()");
    res.json(rows[0]);
  } catch (err) {
    console.error("Failed to fetch returned loans:", err);
    res.status(500).json({ error: "Failed to fetch returned loans" });
  }
});

/* ================= RETURN LOAN ================= */

app.post("/api/loans/return", requireLogin, async (req, res) => {
  try {
    const { loanId } = req.body;

    if (!loanId) {
      return res.status(400).json({ error: "loanId is required" });
    }

    const user = req.session.user;

    if (user.UserType !== 2) {
      return res.status(403).json({
        error: "Only librarians can process returns",
      });
    }

    await db.execute("CALL ReturnLoan(?, ?)", [
      Number(loanId),
      user.UserID,
    ]);

    res.json({
      success: true,
      message: "Return processed successfully",
    });
  } catch (err) {
    console.error("Return route error:", err);
    res.status(500).json({
      error: err.sqlMessage || "Failed to process return",
    });
  }
});

/* ================= NOTIFICATIONS ================= */

app.get("/api/notifications", requireLogin, async (req, res) => {
  try {
    const userId = req.session.user.UserID;

    const [rows] = await db.execute("CALL GetUserNotifications(?)", [
      userId,
    ]);

    res.json(rows[0]);
  } catch (err) {
    console.error("Failed to fetch notifications:", err);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

app.post("/api/notifications/read", requireLogin, async (req, res) => {
  try {
    const { NotificationID } = req.body;

    if (!NotificationID) {
      return res
        .status(400)
        .json({ error: "NotificationID is required" });
    }

    await db.execute("CALL MarkNotificationRead(?)", [
      Number(NotificationID),
    ]);

    res.json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (err) {
    console.error("Mark notification read error:", err);
    res.status(500).json({
      error: err.sqlMessage || "Failed to update notification",
    });
  }
});

/* ================= SERVER START ================= */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// ================ EMPLOYEE AUDIT REPORT =================
// Audit overview route
app.get("/api/librarian/employee-audit/overview", requireLibrarian, async (_req, res) => {
  try {
    const [data] = await db.execute("CALL GetEmployeeAuditOverview()");
    res.json(data[0][0]);
  } catch (err) {
    console.error("Failed to fetch employee audit overview:", err);
    res.status(500).json({ error: "Failed to fetch employee audit overview" });
  }
});

// Audit summary route
app.get("/api/librarian/employee-audit/summary", requireLibrarian, async (_req, res) => {
  try {
    const [data] = await db.execute("CALL GetEmployeeAuditSummary()");
    res.json(data[0][0]);
  } catch (err) {
    console.error("Failed to fetch employee audit summary:", err);
    res.status(500).json({ error: "Failed to fetch employee audit summary" });
  }
});

// Audit report route
app.get("/api/librarian/employee-audit/report", requireLibrarian, async (req, res) => {
  const { startDate, endDate, librarianId, tableName, actionType } = req.query;

  try {
    const [data] = await db.execute("CALL GetEmployeeAuditReport(?, ?, ?, ?, ?)", [
      startDate || null,
      endDate || null,
      librarianId ? Number(librarianId) : null,
      tableName || null,
      actionType || null,
    ]);

    res.json(data[0]);
  } catch (err) {
    console.error("Failed to fetch employee audit report:", err);
    res.status(500).json({ error: "Failed to fetch employee audit report" });
  }
});

app.get("/api/librarian/overview/recent-activity", requireLibrarian, async (_req, res) => {
  try {
    const [rows] = await db.execute("CALL GetRecentActivity()");
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch recent activity" });
  }
});
