import { supabasePublishableKey, supabaseUrl } from "./config.js";

const headers = {
  apikey: supabasePublishableKey,
  Authorization: `Bearer ${supabasePublishableKey}`,
};

async function getJson(path) {
  const response = await fetch(`${supabaseUrl}${path}`, { headers });
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`request failed: ${response.status}`);
  }
  return response.json();
}

export async function fetchRoutes() {
  const body = await getJson("/functions/v1/kmb-routes");
  return body?.routes ?? [];
}

export async function fetchTransfer(route, secondary = []) {
  const params = new URLSearchParams({ route });
  for (const item of secondary) params.append("secondary", item);
  return getJson(`/functions/v1/kmb-transfer?${params}`);
}
