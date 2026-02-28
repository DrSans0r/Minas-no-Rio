const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");

const orders = [];

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

function serveStaticFile(filePath, res) {
  fs.readFile(filePath, (err, content) => {
    if (err) {
      sendJson(res, 404, { error: "Arquivo nao encontrado." });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": mimeTypes[ext] || "application/octet-stream" });
    res.end(content);
  });
}

function collectBody(req, callback) {
  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
    if (body.length > 1e6) {
      req.socket.destroy();
    }
  });
  req.on("end", () => callback(body));
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "GET" && url.pathname === "/api/health") {
    sendJson(res, 200, { status: "ok", service: "minas-no-rio" });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/orders") {
    sendJson(res, 200, orders);
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/orders") {
    collectBody(req, (rawBody) => {
      let data;
      try {
        data = JSON.parse(rawBody || "{}");
      } catch {
        sendJson(res, 400, { error: "JSON invalido." });
        return;
      }

      const { customerName, phone, type, address, payment, items, notes, total } = data;

      if (!customerName || !phone || !type || !payment || !Array.isArray(items) || items.length === 0) {
        sendJson(res, 400, {
          error: "Dados incompletos. Informe nome, telefone, tipo, pagamento e itens do pedido."
        });
        return;
      }

      if (type === "entrega" && !address) {
        sendJson(res, 400, { error: "Informe o endereco para entrega." });
        return;
      }

      const order = {
        id: `MNR-${Date.now()}`,
        createdAt: new Date().toISOString(),
        customerName,
        phone,
        type,
        address: address || "Retirada no ponto combinado",
        payment,
        items,
        notes: notes || "",
        total: Number(total || 0)
      };

      orders.push(order);

      sendJson(res, 201, {
        message: "Pedido recebido com sucesso!",
        order
      });
    });
    return;
  }

  if (req.method === "GET") {
    const safePath = url.pathname === "/" ? "/index.html" : url.pathname;
    const normalizedPath = path.normalize(safePath).replace(/^([.][.][\/\\])+/, "");
    const filePath = path.join(PUBLIC_DIR, normalizedPath);

    if (!filePath.startsWith(PUBLIC_DIR)) {
      sendJson(res, 403, { error: "Acesso negado." });
      return;
    }

    serveStaticFile(filePath, res);
    return;
  }

  sendJson(res, 404, { error: "Rota nao encontrada." });
});

server.listen(PORT, () => {
  console.log(`Servidor Minas no Rio em http://localhost:${PORT}`);
});
