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
        
        //CHECKOUT AND HOLD

        if(method === "POST" && url === "/api/checkout") {
            const cookies = parseCookies(req);
            const sessionID = cookies.sessionID;

            if (!sessionID || !sessions.has(sessionID)) {
                sendJson(res, 401, {loggedIn : false});
                return;
            }

            const session = sessions.get(sessionID);
            const body = await getJsonBody(req);
            const { itemId } = body;
            const userID = session.UserID;
            
            if(!itemId) {
                return res.status(400).json({
                    error: "No item selected"
                });
            }

            await db.execute("CALL CheckoutItem(?,?)",[userID, itemId]);

            sendJson(res, 201, {
                success: true,
                message: "Item checked out"
            });
            return;
        }

        if(method === "POST" && url === "/api/hold"){
          const cookies = parseCookies(req);
          const sessionID = cookies.sessionID;

          if (!sessionID || !sessions.has(sessionID)) {
              sendJson(res, 401, {loggedIn : false});
              return;
          }

          const session = sessions.get(sessionID);
          const body = await getJsonBody(req);
          const { itemId } = body;
          const userID = session.UserID;

          await db.execute("CALL CreateHold(?,?)", [userID, itemId]);

          sendJson(res,200,{success: true, message: "Hold placed successfully"});
        }

        //LIBRARIAN USERS
        if(method === "GET" && url === "/api/librarian/users") {
          const [rows] = await db.execute("CALL GetUsers()");
          sendJson(res,200,rows[0]);
          return;
        }

        if(method === "POST" && url === "/api/librarian/users") {
          const cookies = parseCookies(req);
          const sessionID = cookies.sessionID;
          const session = sessions.get(sessionID);

          const body = await getJsonBody(req);
          const { FirstName, LastName, Email, Password, UserType } = body;

          const userType = Number(UserType) || 0;
          const librarianID = session.UserID;

          await db.execute("CALL AddUser(?, ?, ?, ?, ?, ?)", [
            Password,
            FirstName,
            LastName,
            Email,
            userType,
            librarianID,
          ]);

          const [rows] = await db.execute("SELECT UserID FROM users WHERE Email = ?", [Email]);

          sendJson(res,201, {message: "User added", id: rows[0].UserID});
        }

        if(method === "DELETE" && url === "/api/librarian/users/:id") {
          const urlParts = req.url.split("/");
          const userId = Number(urlParts[3]);
          const cookies = parseCookies(req);
          const sessionID = cookies.sessionID;
          const session = sessions.get(sessionID);

          if (userId === session.UserID) {
            sendJson(res,400,{error: "Cannot delete your own account"});
            return;
          }

          await db.execute("CALL DeleteUser(?)", [userId]);

          sendJson(res,200,{message: "User Deleted Successfully"});
          return;
        }

        //LIBRARIAN CATALOGUE

        if(method === "DELETE" && "/api/librarian/catalog/literature/:id") {
          const urlParts = req.url.split("/");
          await db.execute("CALL DeleteLiterature(?)", Number(urlParts[3]));
          sendJson(res,200,{message: "Literature Delete Success"});
          return;
        }

        if (method === "GET" && url.startsWith("/api/librarian/catalog/") && url.endsWith("/copies")) {
          const urlParts = req.url.split("/");
          const itemId = Number(urlParts[4]);

          if (Number.isNaN(itemId)) {
            sendJson(res, 400, { error: "Invalid item ID" });
            return;
          }

          const [rows] = await db.execute("CALL GetItemCopies(?)", [itemId]);
          sendJson(res, 200, rows[0]);
          return;
        }

        if(method === "DELETE" && url === "/api/librarian/catalog/copies/:copyId"){
          const urlParts = req.url.split("/");
          await db.execute("CALL DeleteCopy(?)", Number(urlParts[4]));
          sendJson(res,200,{message:"Copy Delete Success"});
          return;
        }

        if(method === "DELETE" && url === "/api/librarian/catalog/devices/:id") {
          const urlParts = req.url.split("/");
          await db.execute("CALL DeleteDevice(?)", Number(urlParts[4]));
          sendJson(res,200,{message:"Device Delete Success"});
          return;
        }

        if(method === "POST" && url === "/api/librarian/catalog/devices") {
          const body = await getJsonBody(req);
          const { Title, ItemType, Manufacturer, Model, Copies } = body;

          const [[{nextID}]] = await db.execute("SELECT COALESCE(MAX(ItemID), 0) + 1 AS nextID FROM items");

          sendJson(res,201, {message: "Device Added Successfully"});
          return;
        }

        if(method === "DELETE" && url === "/api/librarian/catalog/media/:id"){
          const urlParts = req.url.split("/");
          await db.execute("CALL DeleteMedia(?)", Number(urlParts[4]));
          sendJson(res,200,{message:"Media Deleted Success"});
          return;
        }

        if(method === "POST" && url === "/api/librarian/catalog/media") {
          const cookies = parseCookies(req);
          const sessionID = cookies.sessionID;
          const session = sessions.get(sessionID);
          const body = await getJsonBody(req);
          const { Title, ItemType, Producer, DurationMinutes, Copies } = body;

          const [[{nextID}]] = await db.execute("SELECT COALESCE(MAX(ItemID), 0) + 1 AS nextID FROM items");

          await db.execute("CALL AddMedia(?,?,?,?,?,?,?)",
            [
              nextID,
              Title,
              ItemType,
              Producer,
              DurationMinutes || null,
              Copies,
              session.UserID
            ]
          );

          sendJson(res,201,{message: "media added"});
        }

        if(method === "POST" && url === "/api/librarian/catalog/literature") {
          const cookies = parseCookies(req);
          const sessionID = cookies.sessionID;
          const session = sessions.get(sessionID);
          const body = await getJsonBody(req);
          const { ItemID, Title, ItemType, Author, Publisher, PublicationYear, Copies} = body;

          await db.execute("CALL AddLiterature(?, ?, ?, ?, ?, ?, ?, ?)", [
            ItemID,
            Title,
            ItemType,
            Author,
            Publisher,
            PublicationYear || null,
            Copies,
            session.UserID
          ]);

          sendJson(res,201,{message: "Literature Added Successfully"});
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

        sendJson(res,404, {error: "Route not found"});
    } catch (err) {
        console.error(err);
        sendJson(res,500, { error: "Server error"});
    }
});

server.listen(PORT, () => {
    console.log(`SERVER RUNNING ON PORT : ${PORT}`);
});