export const handler = async () => ({
  statusCode: 200,
  headers: { "content-type": "text/plain; charset=utf-8" },
  body: process.env.DATABASE_URL ? "DATABASE_URL: OK" : "DATABASE_URL: MISSING"
});