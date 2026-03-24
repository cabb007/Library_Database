import express from 'express';
import mysql from 'mysql2';
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

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
})

db.connect((err) => {
    if (err) {
        console.error("database connection failed: " + err.stack);
        return;
    }
    console.log("connected to the database");
})

app.get('/api/data', (req, res) => {
    res.json({
        message: 'Hello from Express!'
    })
})

app.get('/users', (req, res) => {
    const sql = 'SELECT * FROM users';
    db.query(sql, (err, data) => {
        if (err) return res.json(err);
        return res.json(data);
    })

})

const PORT = 5173;
app.listen(PORT, () => console.log('Server running on port ' + PORT));