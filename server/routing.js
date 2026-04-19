import http from "http";
import url from "url";
import crypto from "crypto";
import fs from "fs";
import path from "path";

/* ================= SESSIONS ================= */

const sessions = new Map();

/* ================= ROUTE MATCHING ================= */

function matchRoute(routePath, actualPath) {
  const routeParts = routePath.split("/");
  const pathParts = actualPath.split("/");

  if (routeParts.length !== pathParts.length) return null;

  const params = {};

  for (let i = 0; i < routeParts.length; i++) {
    if (routeParts[i].startsWith(":")) {
      params[routeParts[i].slice(1)] = pathParts[i];
    } else if (routeParts[i] !== pathParts[i]) {
      return null;
    }
  }

  return params;
}

/* ================= SESSION HANDLER ================= */

function getSession(req, res) {
  const cookieHeader = req.headers.cookie || "";

  const cookies = Object.fromEntries(
    cookieHeader.split(";").map(c => {
      const [k, ...v] = c.trim().split("=");
      return [k, v.join("=")];
    })
  );

  const sid = cookies.sid;

  if (sid && sessions.has(sid)) {
    return sessions.get(sid);
  }

  const newSid = crypto.randomUUID();

  const session = {
    user: null,
    SelectedItem: null, // IMPORTANT: persistent checkout state lives here
  };

  sessions.set(newSid, session);

  res.setHeader(
    "Set-Cookie",
    `sid=${newSid}; HttpOnly; Path=/; SameSite=Lax`
  );

  return session;
}

/* ================= APP FACTORY ================= */

export function createApp() {
  const routes = [];
  const middlewares = [];

  const app = (req, res) => {
    const parsed = url.parse(req.url, true);
    req.query = parsed.query;
    req.pathname = parsed.pathname;

    /* ---------- RESPONSE HELPERS ---------- */

    res.status = (code) => {
      res.statusCode = code;
      return res;
    };

    res.json = (data) => {
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(data));
    };

    res.send = (data) => {
      res.end(data);
    };

    /* ---------- BODY PARSER ---------- */

    let body = "";

    req.on("data", (chunk) => {
      body += chunk;

      // safety limit (1MB)
      if (body.length > 1e6) req.destroy();
    });

    req.on("end", () => {
      try {
        req.body = body ? JSON.parse(body) : {};
      } catch {
        req.body = {};
      }

      req.session = getSession(req, res);

      /* ---------- MIDDLEWARE CHAIN ---------- */

      let i = 0;

      const runRoute = () => {
        for (const r of routes) {
          const params = matchRoute(r.path, req.pathname);

          if (r.method === req.method && params) {
            req.params = params;
            return r.handler(req, res);
          }
        }

        res.status(404).json({ error: "Not found" });
      };

      const next = () => {
        const mw = middlewares[i++];

        if (!mw) return runRoute();

        // Express-style middleware (req, res, next)
        if (mw.length === 3) {
          return mw(req, res, next);
        }

        // simple middleware (req, res)
        mw(req, res);
        return next();
      };

      next();
    });
  };

  /* ================= ROUTES ================= */

  function register(method, path, handler) {
    routes.push({ method, path, handler });
  }

  app.get = (p, h) => register("GET", p, h);
  app.post = (p, h) => register("POST", p, h);
  app.put = (p, h) => register("PUT", p, h);
  app.delete = (p, h) => register("DELETE", p, h);

  /* ================= MIDDLEWARE ================= */

  app.use = (fn) => {
    middlewares.push(fn);
  };

  /* ================= EXPRESS COMPATIBILITY NO-OPS ================= */

  app.set = () => {};

  /* ================= STATIC FILES ================= */

  app.static = (basePath) => {
    return (req, res, next) => {
      const filePath = path.join(basePath, req.pathname);

      if (!filePath.startsWith(basePath)) return next();

      if (fs.existsSync(filePath)) {
        fs.createReadStream(filePath).pipe(res);
        return;
      }

      next();
    };
  };

  /* ================= SERVER ================= */

  app.listen = (port, cb) => {
    http.createServer(app).listen(port, cb);
  };

  return app;
}