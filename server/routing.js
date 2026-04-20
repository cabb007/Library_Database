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

function isPromiseLike(value) {
  return value && typeof value.then === "function";
}

function normalizeHandlers(handlers, label) {
  const normalized = [];

  const visit = (handler) => {
    if (Array.isArray(handler)) {
      handler.forEach(visit);
      return;
    }

    if (typeof handler !== "function") {
      throw new TypeError(`${label} must be a function`);
    }

    normalized.push(handler);
  };

  handlers.forEach(visit);

  if (normalized.length === 0) {
    throw new TypeError(`${label} requires at least one handler`);
  }

  return normalized;
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
    `sid=${newSid}; Path=/; SameSite=None; Secure; HttpOnly; Max-Age=${60 * 60 * 24}`
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

      const matchRequestRoute = () => {
        for (const r of routes) {
          const params = matchRoute(r.path, req.pathname);

          if (r.method === req.method && params) {
            return { route: r, params };
          }
        }

        return null;
      };

      const matched = matchRequestRoute();
      req.params = matched?.params || {};

      const stack = [
        ...middlewares,
        ...(matched?.route.handlers || []),
      ];

      const finish = (err) => {
        if (res.writableEnded || res.destroyed) return;

        if (err) {
          console.error(err);

          const statusCode =
            Number.isInteger(err?.statusCode) ? err.statusCode
            : Number.isInteger(err?.status) ? err.status
            : 500;

          return res
            .status(statusCode)
            .json({ error: err?.message || "Internal Server Error" });
        }

        return res.status(404).json({ error: "Not found" });
      };

      let index = 0;

      const dispatch = (err) => {
        if (res.writableEnded || res.destroyed) return;

        const handler = stack[index++];

        if (!handler) {
          return finish(err);
        }

        const isErrorHandler = handler.length === 4;

        if (err && !isErrorHandler) {
          return dispatch(err);
        }

        if (!err && isErrorHandler) {
          return dispatch();
        }

        let called = false;

        const next = (nextErr) => {
          if (called) return;
          called = true;
          dispatch(nextErr);
        };

        try {
          const result = err
            ? handler(err, req, res, next)
            : handler(req, res, next);

          if (isPromiseLike(result)) {
            result.catch(next);
          }
        } catch (caughtErr) {
          next(caughtErr);
        }
      };

      dispatch();
    });
  };

  /* ================= ROUTES ================= */

  function register(method, path, ...handlers) {
    routes.push({
      method,
      path,
      handlers: normalizeHandlers(
        handlers,
        `Route handlers for ${method} ${path}`
      ),
    });
  }

  app.get = (p, ...h) => register("GET", p, ...h);
  app.post = (p, ...h) => register("POST", p, ...h);
  app.put = (p, ...h) => register("PUT", p, ...h);
  app.delete = (p, ...h) => register("DELETE", p, ...h);

  /* ================= MIDDLEWARE ================= */

  app.use = (...handlers) => {
    middlewares.push(...normalizeHandlers(handlers, "Middleware"));
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
