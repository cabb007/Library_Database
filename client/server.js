import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/data', (req, res) => {
    res.json({
        message: 'Hello from Express!'
    })
})

const PORT = 5173;
app.listen(PORT, () => console.log('Server running on port ' + PORT));