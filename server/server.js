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
        "Access-Control-Allow-Methods" : "GET, POST, OPTIONS, PUT, DELETE",
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
        "Access-Control-Allow-Methods" : "GET, POST, OPTIONS, PUT, DELETE",
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
            "Access-Control-Allow-Methods" : "GET, POST, OPTIONS, PUT, DELETE",
            "Access-Control-Allow-Headers" : "Content-Type"
        });
        res.end();
        return;
    }

    try {
        //LANDING PAGE
        if (method === "GET" && url === "/") {
            sendText(res,200,"Backend is running");
            return;
        }
        //SERVER HEALTH CHECK
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
                UserType: user.UserType,
                ConfirmFlag: 0,
                SelectedItem: null
            });

            sendJson(res,200,{success:true, user:sessions.get(sessionID)},
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
                sendJson(res,400, {error: "No item selected."});
                return;
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
            const session = sessions.get(sessionID);
            const userID = session.UserID;
            const body = await getJsonBody(req);
            const { itemId } = body;


            await db.execute("CALL CreateHold(?,?)", [userID, itemId]);

            sendJson(res,200,{success: true, message: "Hold placed successfully"});
        }

        //LIBRARIAN USER ROUTES

        //USERS RETRIEVAL
        if(method === "GET" && url === "/api/librarian/users") {
          const [rows] = await db.execute("CALL GetUsers()");
          sendJson(res,200,rows[0]);
          return;
        }

        //UPDATE USER
        if(method === "PUT" && url.startsWith("/api/librarian/users/")){
            const cookies = parseCookies(req);
            const sessionID = cookies.sessionID;
            const session = sessions.get(sessionID);
            const urlParts = req.url.split("/");
            const userId = Number(urlParts[4]);


            if (userId === session.UserID) {
                sendJson(res,401,{message: "Cannot edit own account"})
                return;
            }

            const body = await getJsonBody(req);
            const { FirstName, LastName, Email, UserType, Status } = body;

            await db.execute("CALL UpdateUser(?, ?, ?, ?, ?, ?, ?)", [userId, FirstName, LastName, Email, UserType, Status,session.UserID]);

            sendJson(res,200,{message: "User Updated success"});
            return;
        }

        //ADD USER
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


        //USER DELETION
        if(method === "DELETE" && url.startsWith("/api/librarian/users/")) {
          const urlParts = req.url.split("/");
          const userId = Number(urlParts[4]);
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

        //LIBRARIAN CATALOGUE/ITEMS ROUTES

        //DELETE LITERATURE
        if(method === "DELETE" && url.startsWith("/api/librarian/catalog/literature/")) {
          const urlParts = req.url.split("/");
          await db.execute("CALL DeleteLiterature(?)", [Number(urlParts[5])]);
          sendJson(res,200,{message: "Literature Delete Success"});
          return;
        }


        //RETRIEVE COPIES/CATALOGUE
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

        //DELETE A COPY
        if(method === "DELETE" && url.startsWith("/api/librarian/catalog/copies/")){
          const urlParts = req.url.split("/");
          await db.execute("CALL DeleteCopy(?)", [Number(urlParts[4])]);
          sendJson(res,200,{message:"Copy Delete Success"});
          return;
        }

        //DELETE A DEVICE
        if(method === "DELETE" && url.startsWith("/api/librarian/catalog/devices/")) {
          const urlParts = req.url.split("/");
          await db.execute("CALL DeleteDevice(?)", [Number(urlParts[4])]);
          sendJson(res,200,{message:"Device Delete Success"});
          return;
        }

        //ADD A DEVICE
        if(method === "POST" && url === "/api/librarian/catalog/devices") {
            const cookies = parseCookies(req);
            const sessionID = cookies.sessionID;
            const session = sessions.get(sessionID);
            const body = await getJsonBody(req);
            const { Title, ItemType, Manufacturer, Model, Copies } = body;

            const [[{nextID}]] = await db.execute("SELECT COALESCE(MAX(ItemID), 0) + 1 AS nextID FROM items");

            await db.execute("CALL AddDevice(?, ?, ?, ?, ?, ?, ?)", [
                nextID,
                Title,
                ItemType,
                Manufacturer,
                Model || null,
                Copies,
                session.UserID,
            ]);

            sendJson(res,201, {message: "Device Added Successfully"});
            return;
        }

        //UPDATE DEVICE
        if(method === "PUT" && url.startsWith("/api/librarian/catalog/devices/")){
            const cookies = parseCookies(req);
            const sessionID = cookies.sessionID;
            const session = sessions.get(sessionID);
            const urlParts = req.url.split("/");
            const deviceId = urlParts[5];
            const body = await getJsonBody(req);
            const { Title, ItemType, Manufacturer, Model } = body;

            await db.execute("CALL UpdateDevice(?, ?, ?, ?, ?, ?)", [
                deviceId, Title, ItemType, Manufacturer, Model || null,
                session.UserID
            ]);

            sendJson(res,200,{message: "Device updated successfully"});
            return;
        }


        //DELETE MEDIA
        if(method === "DELETE" && url.startsWith("/api/librarian/catalog/media/")){
          const urlParts = req.url.split("/");
          await db.execute("CALL DeleteMedia(?)", [Number(urlParts[4])]);
          sendJson(res,200,{message:"Media Deleted Success"});
          return;
        }

        //ADD MEDIA
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

        //UPDATE MEDIA
        if(method === "PUT" && url.startsWith("/api/librarian/catalog/media/")){
            const cookies = parseCookies(req);
            const sessionID = cookies.sessionID;
            const session = sessions.get(sessionID);
            const urlParts = req.url.split("/");
            const mediaId = urlParts[5];
            const body = await getJsonBody(req);
            const { Title, ItemType, Producer, DurationMinutes } = body;
            
            await db.execute("CALL UpdateMedia(?, ?, ?, ?, ?, ?)", [
                mediaId, Title, ItemType, Producer, DurationMinutes ? DurationMinutes : null,
                session.UserID
            ]);
            sendJson(res,200,{message: "Media updated"});

        }

        //ADD LITERATURE
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

        //UPDATE LITERATURE
        if(method === "PUT" && url.startsWith("/api/librarian/catalog/literature/")) {
            const cookies = parseCookies(req);
            const sessionID = cookies.sessionID;
            const session = sessions.get(sessionID);
            const urlParts = req.url.split("/");
            const litId = urlParts[5];

            const body = getJsonBody(req);
            const {Title, ItemType, Author, Publisher, PublicationYear} = body;

            await db.execute("CALL UpdateLiterature(?, ?, ?, ?, ?, ?, ?)", [
                litId, Title, ItemType, Author, Publisher,
                PublicationYear ? PublicationYear : null, session.UserID
            ]);
            sendJson({message: "Literature Updated Successfully"});
        }

        //LIBRARIAN FINES

        //GET FINES

        //GET PAID FINES

        //GET UNPAID FINES

        //DATA CALLS FROM DB (QUERIES)

        //LITERATURE DATA
        if (method === "GET" && url === "/api/literature") {
            const [data] = await db.execute("CALL GetLiterature()");
            sendJson(res,200,data);
            return;
        }

        //MEDIA DATA
        if (method === "GET" && url === "/api/media") {
            const [data] = await db.execute("CALL GetMedia()");
            sendJson(res,200,data);
            return;
        }

        //DEVICE DATA
        if (method === "GET" && url === "/api/devices") {
            const [data] = await db.execute("CALL GetDevices()");
            sendJson(res,200,data);
            return;
        }

        //TITLE (?) DATA
        if(method === "GET" && url === "/api/title") {
            const cookies = parseCookies(req);
            const sessionID = cookies.sessionID;
            const session = sessions.get(sessionID);

            const selectedItem = session.UserID;

            if(!selectedItem) {
                sendJson(res,400,{error: "No item selected"});
            }

            const [data] = await db.execute("CALL getTitle(?)", [selectedItem]);

            sendJson(res,200,[data]);
        }

        //ANALYTICS

        //ANALYTICS STATS OVERVIEW
        if(method === "GET" && url === "/api/librarian/overview/stats"){
            const [data] = await db.execute("CALL GetOverviewStats()");
            sendJson(res,200,data[0][0]);
            return;
        }

        //ANALYTICS SUMMARY
        if(method === "GET" && url === "/api/librarian/analytics/summary"){
            const [data] = await db.execute("CALL GetAnalyticsSummary()");
            sendJson(res,200,data[0][0]);
            return;
        }
        //ANALYTICS MOST CHECKED OUT
        if(method === "GET" && url === "/api/librarian/analytics/most-checked-out"){
            //WORK IN PROGRESS
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