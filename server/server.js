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

console.log("db loaded");
app.use(express.json());
app.use(session({
    secret: "secret_key", //need to implement a better secret key later for logged in session security
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24 //session lasts 1 day
    }
}))


/* ================== REGISTER ================= */
// When a user self-registers via CreateUser (default UserType 0 = student)
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
        console.error("Failed to fetch devices: ", err);
        res.status(500).json({ error: "Failed to fetch devices" });
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {console.log(`Server running on port ${PORT}`);
});