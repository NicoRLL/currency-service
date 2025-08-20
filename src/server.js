import express from "express";
import { fetchRate } from "./rateProvider.js";
import { prisma } from "./db.js";

const app = express();
const PORT = 3000;

app.get("/health", (req, res) => {
    res.send("ok");
});

app.get("/fx/quote", async (req, res) => {
    try {
        const from = String(req.query.from ?? "").toUpperCase();
        const to = String(req.query.to ?? "").toUpperCase();
        const amount = Number(req.query.amount ?? "0");

        const isCurrency = (c) => /^[A-Z]{3}$/.test(c);
        if (!isCurrency(from) || !isCurrency(to)) {
            return res.status(400).json({
                error:
                    "Parámetros 'from' y 'to' deben ser códigos ISO 4217 (p.ej., UYU, USD).",
            });
        }
        if (!Number.isFinite(amount) || amount <= 0) {
            return res.status(400).json({
                error: "El parámetro 'amount' debe ser un número > 0.",
            });
        }
        if (from === to) {
            return res.status(400).json({
                error: "Las monedas 'from' y 'to' no pueden ser iguales.",
            });
        }

        const { rate, providerTimestamp, providerName } = await fetchRate(from, to);

        const received = Math.round((amount * rate + Number.EPSILON) * 100) / 100;

        const date = new Date(providerTimestamp);

        const formatter = new Intl.DateTimeFormat("es-UY", {
            dateStyle: "full",
            timeStyle: "short",
            timeZone: "America/Montevideo"
        });

        const localTime = formatter.format(date);

        const clientIp =
            (req.headers["x-forwarded-for"]?.split(",")[0]?.trim()) ||
            req.socket.remoteAddress ||
            req.ip ||
            null;

        const userAgent = req.get("user-agent") ?? null;

        try {
            await prisma.fxLog.create({
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
        } catch (e) {
            console.error("No se pudo guardar el log en SQLite:", e);
        }

        return res.send(`
        Conversión de ${amount} ${from} a ${to}:
        - Tasa: ${rate}
        - Recibirías: ${received} ${to}
        - Fuente: ${providerName}
        - Última actualización: ${localTime}
        `);

    } catch (err) {
        console.error(err);
        return res.status(502).json({
            error: "No se pudo obtener el tipo de cambio en este momento.",
        });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
