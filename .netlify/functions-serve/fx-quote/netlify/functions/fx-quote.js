var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// netlify/functions/fx-quote.js
var fx_quote_exports = {};
__export(fx_quote_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(fx_quote_exports);

// src/rateProvider.js
async function fetchRate(from, to) {
  const base = String(from).toUpperCase();
  const quote = String(to).toUpperCase();
  const url = `https://open.er-api.com/v6/latest/${encodeURIComponent(base)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`FX provider error: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  if (data.result !== "success") {
    throw new Error(`FX provider returned error: ${data["error-type"] || "unknown"}`);
  }
  const rate = data.rates?.[quote];
  if (typeof rate !== "number") {
    throw new Error(`No hay tasa para ${base} -> ${quote}`);
  }
  return {
    rate,
    providerTimestamp: data.time_last_update_utc,
    providerName: "ExchangeRate-API (open.er-api.com)"
  };
}

// netlify/functions/lib/prisma.js
var import_client = require("@prisma/client");
var prisma = globalThis.__PRISMA__;
if (!prisma) {
  prisma = new import_client.PrismaClient();
  prisma.$connect().catch((e) => {
    console.error("Prisma $connect error:", e);
  });
  if (process.env.NODE_ENV !== "production") {
    globalThis.__PRISMA__ = prisma;
  }
}

// netlify/functions/fx-quote.js
var TZ = "America/Montevideo";
var handler = async (event) => {
  try {
    const q = event.queryStringParameters ?? {};
    const from = String(q.from || "").toUpperCase();
    const to = String(q.to || "").toUpperCase();
    const amount = Number(q.amount || "0");
    const isCurrency = (c) => /^[A-Z]{3}$/.test(c);
    if (!isCurrency(from) || !isCurrency(to)) {
      return text(400, "Par\xE1metros 'from' y 'to' deben ser ISO 4217 (p.ej., UYU, USD).");
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return text(400, "El par\xE1metro 'amount' debe ser un n\xFAmero > 0.");
    }
    if (from === to) {
      return text(400, "Las monedas 'from' y 'to' no pueden ser iguales.");
    }
    const { rate, providerTimestamp, providerName } = await fetchRate(from, to);
    const received = Math.round((amount * rate + Number.EPSILON) * 100) / 100;
    const localTime = new Intl.DateTimeFormat("es-UY", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: TZ
    }).format(new Date(providerTimestamp));
    const clientIp = (event.headers["x-forwarded-for"] || "").split(",")[0].trim() || null;
    const userAgent = event.headers["user-agent"] || null;
    try {
      const created = await prisma.fxLog.create({
        data: {
          fromCurrency: from,
          toCurrency: to,
          amount,
          rate,
          received,
          provider: providerName,
          providerTimestamp,
          clientIp,
          userAgent
        }
      });
      console.log("FX log insertado:", created.id, from, to, amount, rate);
    } catch (e) {
      console.error("Error al insertar FX log:", e?.message, e);
    }
    return text(200, `
Conversi\xF3n de ${amount} ${from} a ${to}

- Tasa: ${rate}
- Recibir\xEDas: ${received} ${to}
- Fuente: ${providerName}
- \xDAltima actualizaci\xF3n: ${localTime}
`);
  } catch (err) {
    console.error("Handler error:", err);
    return text(502, "No se pudo obtener el tipo de cambio en este momento.");
  }
};
function text(status, body) {
  return {
    statusCode: status,
    headers: { "content-type": "text/plain; charset=utf-8" },
    body
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
//# sourceMappingURL=fx-quote.js.map
