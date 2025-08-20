import { fetchRate } from "../../src/rateProvider.js";
import { prisma } from "./lib/prisma.js";

const TZ = "America/Montevideo";

export const handler = async (event) => {
  try {
    const q = event.queryStringParameters ?? {};
    const from = String(q.from || "").toUpperCase();
    const to = String(q.to || "").toUpperCase();
    const amount = Number(q.amount || "0");

    const isCurrency = (c) => /^[A-Z]{3}$/.test(c);
    if (!isCurrency(from) || !isCurrency(to)) {
      return text(400, "Parámetros 'from' y 'to' deben ser ISO 4217 (p.ej., UYU, USD).");
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return text(400, "El parámetro 'amount' debe ser un número > 0.");
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
Conversión de ${amount} ${from} a ${to}

- Tasa: ${rate}
- Recibirías: ${received} ${to}
- Fuente: ${providerName}
- Última actualización: ${localTime}
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
