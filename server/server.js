import http from "node:http";
import crypto from "node:crypto";
import mysql from "mysql2/promise";
import "dotenv/config";

const PORT = Number(process.env.PORT) || 3000;
const sessions = new Map();

function parseCookies(req) {
    const header = req.headers.cookie;
    const cookies = {};

    if(!header) {
        return cookies;
    }

    for (const part of header.split(";")) {
        const [rawKey, ...rawValue] = part.trim().split("=");
        const key = rawKey;
        const value = rawValue.join("=");
        
        cookies[key] = decodeURIComponent(value);
    }

    return cookies;
}

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    ssl: {
        rejectUnauthorized: false
    }

});

function sendJson(res, statusCode, data, extraHeaders = {}) {
    res.writeHead(statusCode, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "http://localhost:5173",
        "Access-Control-Allow-Credentials" : "true",
        "Access-Control-Allow-Methods" : "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers" : "Content-Type",
        ...extraHeaders
    });

    res.end(JSON.stringify(data));
}

function sendText(res, statusCode, text) {
    res.writeHead(statusCode, {
        "Content-Type": "text/plain",
        "Access-Control-Allow-Origin": "http://localhost:5173",
        "Access-Control-Allow-Credentials" : "true",
        "Access-Control-Allow-Methods" : "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers" : "Content-Type"
    });

    res.end(text);
}

// translation from req.body function in express, 'helper function'
function getJsonBody(req) {
    return new Promise((resolve, reject) => {
        let body = "";

        req.on("data", chunk => {
            body += chunk;
        });

        req.on("end", () => {
            if (!body) {
                resolve({});
                return;
            }

            try {
                resolve(JSON.parse(body));
            } catch {
                reject(new Error("Invalid JSON"));
            }
        });

        req.on("error", err => {
            reject(err);
        });
    });
}

const server = http.createServer(async (req,res) => {
    const {method,url} = req;

    if (method === "OPTIONS") { 
        res.writeHead(204, {
            "Access-Control-Allow-Origin": "http://localhost:5173",
            "Access-Control-Allow-Credentials" : "true",
            "Access-Control-Allow-Methods" : "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers" : "Content-Type"
        });
        res.end();
        return;
    }

    try {
        //LANDING PAGE - SERVER HEALTH CHECKS
        if (method === "GET" && url === "/") {
            sendText(res,200,"Backend is running");
            return;
        }

        if (method === "GET" && url === "/health") {
            sendText(res,200,"ok");
            return;
        }

        //LOGIN
        if (method === "POST" && url === "/api/login") {
            const body = await getJsonBody(req);
            const { Email, Password } = body;

            const [rows] = await db.execute(
                "SELECT * FROM users WHERE Email = ?",
                [Email]
            );

            if (rows.length === 0 || rows[0].Password !== Password) {
                sendJson(res,401,{error:"Invalid Credentials"});
                return;
            }

            const user = rows[0];

            if(Password != user.Password) {
                sendJson(res,401,{success:false});
            }

            const sessionID = crypto.randomUUID();

            sessions.set(sessionID, {
                Email,
                UserID: user.UserID,
                FirstName: user.FirstName,
                LastName: user.LastName,
                Balance: user.Balance,
                ConfirmFlag: 0,
                SelectedItem: null
            });

            sendJson(res,200, {success:true},
                {
                    "Set-Cookie" : `sessionID=${encodeURIComponent(sessionID)}; Path=/; HttpOnly; SameSite=Lax`
                }
            );
            return;
        }

        //USER AUTHENTICATION CHECK
        if (method === "GET" && url === "/api/me") {
            const cookies = parseCookies(req);
            const sessionID = cookies.sessionID;

            if (!sessionID || !sessions.has(sessionID)) {
                sendJson(res, 401, {loggedIn : false});
                return;
            }

            const session = sessions.get(sessionID);

            sendJson(res,200,{
                loggedIn:true,
                user:session
            });
            return;
        }

        //LOGOUT
        if (method === "POST" && url === "/api/logout") {
            const cookies = parseCookies(req);
            const sessionID = cookies.sessionID;

            if (sessionID) {
                sessions.delete(sessionID);
            }

            sendJson(res,200, {
                success: true, message: "Logged out"
            }, {
                "Set-Cookie": "sessionID=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0"
            });
            return;
        }

        //DATA CALLS FROM DB (QUERIES)
        if (method === "GET" && url === "/api/literature") {
            const [data] = await db.execute("CALL GetLiterature()");
            sendJson(res,200,data);
            return;
        }

        if (method === "GET" && url === "/api/media") {
            const [data] = await db.execute("CALL GetMedia()");
            sendJson(res,200,data);
            return;
        }

        if (method === "GET" && url === "/api/devices") {
            const [data] = await db.execute("CALL GetDevices()");
            sendJson(res,200,data);
            return;
        }

        //USER REGISTRATION FUNCTION
        if (method === "POST" && url === "/api/users") {
            const body = await getJsonBody(req);
            const { FirstName, LastName, Email, Password } = body;

            if (!FirstName || !LastName || !Email || !Password) {
                sendJson(res, 400, { error: "First name, last name, and email are required."});
                return;
            }

            const [result] = await db.execute(
                "INSERT INTO users (FirstName, LastName, Email, Password) VALUES (?,?,?,?)",
                [FirstName, LastName, Email, Password]
            );

            sendJson(res, 201, {
                message: "User registered successfully.",
                id: result.insertId
            });
            return;
        }

        sendJson(res,404, {error: "Route not found"});
    } catch (err) {
        console.error(err);
        sendJson(res,500, { error: "Server error"});
    }
});

server.listen(PORT, () => {
    console.log(`SERVER RUNNING ON PORT : ${PORT}`);
});