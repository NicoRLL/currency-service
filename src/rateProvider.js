export async function fetchRate(from, to) {
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
