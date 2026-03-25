import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import session from 'express-session';
import 'dotenv/config';

const app = express();

app.use(cors({
    origin : "http://localhost:5173",
    credentials: true
}));

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

console.log({
    DB_HOST: process.env.DB_HOST,
    DB_PORT: process.env.DB_PORT,
    DB_USER: process.env.DB_USER,
    DB_NAME: process.env.DB_NAME,
    DB_PASSWORD_PRESENT: !!process.env.DB_PASSWORD
});

const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
})

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
})

// login as a user with a max session time of 1 day
app.post("/login", async (req,res) => {
    try {

        const { Email, Password } = req.body;

        if(!Email || !Password) {
            return res.status(400).json({error: "Email and password required"});
        }

        const [rows] = await db.execute(
            "SELECT * FROM users WHERE Email = ?",
            [Email]
        );

        if(rows.length === 0){
            return res.status(401).json({
                success: false,
                message: "invalid creds"
            });
        }

        const user = rows[0];
        
        if(Password != user.Password){
            return res.status(401).json({ success: false, message : "invalid credentials"});
        }

        req.session.user = { //req.session keeps you logged in for a set amount of time, initialized 
            UserID: user.UserID, //in app.use(session(etc...))
            Email: user.Email,
            FirstName : user.FirstName,
            LastName : user.LastName,
            Balance : user.Balance
        };

        return res.json({
            success: true,
            message: "Logged in successfully",
            user: req.session.user
        });
        
    } catch (err){
        console.error("Login Failed: ", err);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
})

//logout as a user, ends/'destroys' the session
app.post("/logout", (req,res) =>{
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
})

//retrieve one user's info
app.get("/me", (req,res) => {
    if(!req.session.user) {
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
app.get("/literature", async (req,res) => {
    try {
        const [literature] = await db.execute(
        "SELECT * FROM literature"
        )

        res.json(literature);

    } catch (err) {
        console.error("Failed to fetch books: ", err);
        res.status(500).json({
            error: "Failed to fetch books"
        });
    }
})

//retrieves number of rows from literature
app.get("/numliterature", async (req,res) => {

    const [rows] = await db.execute(
        "SELECT * FROM literature"
    );

    res.json(rows.length.toString());

})

app.post("/finepayment", async (req,res) => {
    try {
        const {Payment, UserID}= req.body;

        const[balance] = await db.execute(
            "SELECT Balance FROM users WHERE UserID = ?"
            [UserID]
        )

        const[result] = await db.execute(
            "UPDATE users SET Balance = ? WHERE UserID = ?"
            [(balance-Payment),UserID]
        )

        res.json(result)

    } catch (err) {
        console.error("Failed to pay balance: ", err);
        res.status(500).json({
            error: "Failed to pay balance"
        });
    }
})

const PORT = 3000;
app.listen(PORT, () => console.log('Server running on port ' + PORT));