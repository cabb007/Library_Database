import http from "http";
import url from "url";

export function createApp() {
  const routes = [];

  const app = (req, res) => {
    const parsed = url.parse(req.url, true);
    req.query = parsed.query;
    req.pathname = parsed.pathname;

    // 🔧 add Express-like helper
    res.json = (data) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(data));
    };

    // JSON body parser (Express-like)
    let body = "";
    req.on("data", (chunk) => (body += chunk));

    req.on("end", async () => {
      try {
        req.body = body ? JSON.parse(body) : {};
      } catch {
        req.body = {};
      }

      const route = routes.find(
        (r) => r.method === req.method && r.path === req.pathname
      );

      if (route) return route.handler(req, res);

      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not found" }));
    });
  };

  function register(method, path, handler) {
    routes.push({ method, path, handler });
  }

  app.get = (path, handler) => register("GET", path, handler);
  app.post = (path, handler) => register("POST", path, handler);
  app.put = (path, handler) => register("PUT", path, handler);
  app.delete = (path, handler) => register("DELETE", path, handler);

  app.listen = (port, cb) => {
    http.createServer(app).listen(port, cb);
  };

  return app;
}