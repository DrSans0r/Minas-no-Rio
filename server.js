const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ORDERS_TABLE = process.env.SUPABASE_ORDERS_TABLE || "orders";

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

function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
}

async function fetchOrdersFromSupabase() {
  const endpoint = `${SUPABASE_URL}/rest/v1/${SUPABASE_ORDERS_TABLE}?select=*&order=created_at.desc`;
  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Falha ao consultar pedidos no Supabase: ${errorText}`);
  }

  return response.json();
}

async function insertOrderIntoSupabase(orderData) {
  const endpoint = `${SUPABASE_URL}/rest/v1/${SUPABASE_ORDERS_TABLE}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Prefer: "return=representation",
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
    },
    body: JSON.stringify(orderData)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Falha ao salvar pedido no Supabase: ${errorText}`);
  }

  const createdRows = await response.json();
  return createdRows[0];
}

function mapDbOrderToApiOrder(dbOrder) {
  return {
    id: dbOrder.id,
    createdAt: dbOrder.created_at,
    customerName: dbOrder.customer_name,
    phone: dbOrder.phone,
    type: dbOrder.type,
    address: dbOrder.address,
    payment: dbOrder.payment,
    items: dbOrder.items || [],
    notes: dbOrder.notes || "",
    total: Number(dbOrder.total || 0)
  };
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "GET" && url.pathname === "/api/health") {
    sendJson(res, 200, {
      status: "ok",
      service: "minas-no-rio",
      database: isSupabaseConfigured() ? "supabase" : "not-configured"
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/orders") {
    if (!isSupabaseConfigured()) {
      sendJson(res, 500, { error: "Supabase nao configurado no servidor." });
      return;
    }

    fetchOrdersFromSupabase()
      .then((dbOrders) => {
        const orders = dbOrders.map(mapDbOrderToApiOrder);
        sendJson(res, 200, orders);
      })
      .catch((error) => {
        sendJson(res, 500, { error: error.message });
      });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/orders") {
    if (!isSupabaseConfigured()) {
      sendJson(res, 500, { error: "Supabase nao configurado no servidor." });
      return;
    }

    collectBody(req, async (rawBody) => {
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

      const newOrderData = {
        customer_name: customerName,
        phone,
        type,
        address: address || "Retirada no ponto combinado",
        payment,
        items,
        notes: notes || "",
        total: Number(total || 0)
      };

      try {
        const createdDbOrder = await insertOrderIntoSupabase(newOrderData);
        const order = mapDbOrderToApiOrder(createdDbOrder);

        sendJson(res, 201, {
          message: "Pedido recebido com sucesso!",
          order
        });
      } catch (error) {
        sendJson(res, 500, { error: error.message });
      }
    });
    return;
  }

  if (req.method === "GET") {
    const safePath = url.pathname === "/" ? "/index.html" : url.pathname;
    const normalizedPath = path.normalize(safePath).replace(/^([.][.][/\\])+/, "");
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