import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";
import session from "express-session";
import "dotenv/config";

const app = express();

app.set("trust proxy", 1);

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

app.use(express.json());

app.use(session({
    secret: "secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24
    }
}));

const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

/* ================= LOGIN ================= */

app.post("/api/login", async (req, res) => {
    const { Email, Password } = req.body;

    try {
        const [rows] = await db.execute(
            "SELECT * FROM users WHERE Email = ?",
            [Email]
        );

        if (rows.length === 0 || rows[0].Password !== Password) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const user = rows[0];

        req.session.user = {
            UserID: user.UserID,
            Email: user.Email,
            FirstName: user.FirstName,
            LastName: user.LastName,
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

/* ================= AUTH ================= */

app.get("/api/me", (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ loggedIn: false });
    }

    res.json({
        loggedIn: true,
        user: req.session.user
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
        await db.execute("CALL checkout_item(?, ?)", [userID, itemID]);

        // reset selection after success
        req.session.user.SelectedItem = null;

        req.session.save(() => {
            res.json({ success: true, message: "Item checked out" });
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.sqlMessage || "Checkout failed" });
    }
});



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
        await db.execute(
            `INSERT INTO holds (UserID, ItemID, RequestDate, HoldStatus)
             VALUES (?, ?, NOW(), 1)`,
            [userID, itemID]
        );

        req.session.user.SelectedItem = null;

        req.session.save(() => {
            res.json({ success: true, message: "Hold placed" });
        });

    } catch (err) {
        console.error(err);

        if (err.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ error: "Already holding this item" });
        }

        res.status(500).json({ error: "Hold failed" });
    }
});


/* ================= DATA ================= */

app.get("/api/literature", async (req, res) => {
    const [data] = await db.execute("CALL getLiterature()");
    res.json(data);
});

app.get("/api/media", async (req, res) => {
    const [data] = await db.execute("CALL GetMedia()");
    res.json(data);
});

app.get("/api/devices", async (req, res) => {
    const [data] = await db.execute("CALL getDevices()");
    res.json(data);
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

/* ================= SERVER ================= */

app.listen(3000, () => console.log("Server running on 3000"));