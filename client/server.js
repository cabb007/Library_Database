import express from 'express';
import mysql from 'mysql2';
import cors from 'cors';

const app = express();
const dbpw = 't]$y6:mUc}!:HC8}'

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: 'localhost',
    port: '5173',
    user: 'root',
    password: dbpw,
    database: 'library_database'
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