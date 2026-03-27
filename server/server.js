import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import session from 'express-session';
import 'dotenv/config';

const app = express();

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

try {
    const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 3306,
  ssl: {
    rejectUnauthorized: false
  }
});
} catch (err){
    console.log(error.err);
}

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


// This post function is for user registering, adds their information as a row to the database
// registering a user with firstname lastname email and password being input
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

// login as a user with a max session time of 1 day
app.post("/api/login", async (req, res) => {
    try {

        const { Email, Password } = req.body;

        if (!Email || !Password) {
            return res.status(400).json({ error: "Email and password required" });
        }

        const [rows] = await db.execute(
            "SELECT * FROM users WHERE Email = ?",
            [Email]
        );

        if (rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: "invalid creds"
            });
        }

        const user = rows[0];

        if (Password != user.Password) {
            return res.status(401).json({ success: false, message: "invalid credentials" });
        }

        req.session.user = { //req.session keeps you logged in for a set amount of time, initialized 
            UserID: user.UserID, //in app.use(session(etc...))
            Email: user.Email,
            FirstName: user.FirstName,
            LastName: user.LastName,
            Balance: user.Balance
        };

        return res.json({
            success: true,
            message: "Logged in successfully",
            user: req.session.user
        });

    } catch (err) {
        console.error("Login Failed: ", err);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
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

//retrieve one user's info
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

//retrieves the entire literature table from the database
app.get("/api/literature", async (req, res) => {
    try {
        const [literature] = await db.execute(
            "SELECT i.ItemID, i.Title, l.Author, l.Publisher, l.PublicationYear FROM items i JOIN literature l ON i.ItemID = l.ItemID WHERE i.ItemCategory=1"
        )
        res.json(literature);

    } catch (err) {
        console.error("Failed to fetch books: ", err);
        res.status(500).json({
            error: "Failed to fetch books"
        });
    }
});


//retrieves number of rows from literature
app.get("/api/numliterature", async (req, res) => {

    const [rows] = await db.execute(
        "SELECT * FROM literature"
    );

    res.json(rows.length.toString());

});

app.get("/api/numCopies", async (req, res) => {
    const { itemId } = req.params;
    try {
        const [rows] = await db.execute(
            "CALL GetAvailableCopies(?)",
            [itemId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: "Book not found" });
        }

        res.json({ copies: rows[0].CopiesAvailable });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

app.get("/api/media", async (req, res) => {
    try {
        const [media] = await db.execute(
            "SELECT i.ItemID, i.Title, m.Producer, m.DurationMinutes FROM items i JOIN media m ON i.ItemID = m.ItemID WHERE i.ItemCategory = 2"
        );
        res.json(media);
    } catch (err) {
        console.error("Failed to fetch media: ", err);
        res.status(500).json({ error: "Failed to fetch media" });
    }
});

app.get("/api/devices", async (req, res) => {
    try {
        const [media] = await db.execute(
            "SELECT i.ItemID, i.Title, d.Manufacturer, d.Model FROM items i JOIN devices d ON i.ItemID = d.ItemID WHERE i.ItemCategory = 3"
        );
        res.json(media);
    } catch (err) {
        console.error("Failed to fetch devices: ", err);
        res.status(500).json({ error: "Failed to fetch devices" });
    }
});

//gets balance and deducts payment amount from current balance of a specific user
app.put("/api/finepayment", async (req, res) => {
    const user = req.session.user;
    const payamt = req.body;

    console.log(payamt, user);

    try {

        if (payamt > user.Balance) {
            return res.status(400).json({
                error: "Invalid amount"
            });
        }

        await db.execute(
            "UPDATE users SET Balance = Balance - ? WHERE UserID = ?",
            [Number(payamt), user.UserID]
        );

        res.json({ success: true });

    } catch (err) {
        console.error("Failed to pay balance: ", err);
        res.status(500).json({
            error: "Failed to pay balance"
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {console.log(`Server running on port ${PORT}`);
});