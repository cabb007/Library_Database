import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import session from 'express-session';
import 'dotenv/config';

const app = express();

app.set("trust proxy", 1);

app.use(cors({
    origin: [ "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:4280",
        "https://brave-field-0e8fa9510.1.azurestaticapps.net"],
        credentials: true
}));

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

app.use(express.json());
app.use(session({
    secret: "secret_key", //need to implement a better secret key later for logged in session security
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        proxy: true, // 🔥
        maxAge: 1000 * 60 * 60 * 24 //session lasts 1 day
    }
}))


/* ================== REGISTER ================= */
app.post("/api/users", async (req, res) => {
    try {
        const { FirstName, LastName, Email, Password } = req.body;
        if (!FirstName || !LastName || !Email || !Password) {
            return res.status(400).json({ error: "First name, last name, and email are required." });
        }

        const [result] = await db.execute(
            "INSERT INTO users (FirstName, LastName, Email, Password) VALUES (?,?,?,?)",
            [FirstName, LastName, Email, Password]
        );

        res.status(201).json({
            message: "User registered successfully.",
            id: result.insertId,
        });
    } catch (error) {
        console.error("Insert Failed: ", error);
        res.status(500).json({ error: "Failed to register user" });
    }
});

/* ================= LOGIN ================= */

app.post("/api/login", async (req, res) => {
    const { Email, Password } = req.body;
   
    try {
        if (!Email || !Password) {
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


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {console.log(`Server running on port ${PORT}`);
});