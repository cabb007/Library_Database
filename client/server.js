import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import 'dotenv/config';

const app = express();

app.use(cors());
app.use(express.json());

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

app.post("/login", async (req,res) => {
    console.log("req.body:", req.body);
    console.log("Email:", Email);
    console.log("Password:", Password);
    console.log("rows:", rows);
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

        return res.json({
            success: true,
            user: {
                UserID : user.UserID,
                Email : user.Email
            }
        });
        
    } catch (err){
        console.error("Login Failed: ", err);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
})

const PORT = 3000;
app.listen(PORT, () => console.log('Server running on port ' + PORT));