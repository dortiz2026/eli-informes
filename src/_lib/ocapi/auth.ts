import "server-only";
import type { OcapiTokenResponse } from "@/_lib/definitions";

// ==================== Token Cache ====================
// Cache en memoria para evitar solicitar un token nuevo en cada petición.
// Los tokens de OCAPI duran ~30 minutos. Renovamos con 5 minutos de margen.

interface CachedToken {
  accessToken: string;
  expiresAt: number; // timestamp en ms
}

const tokenCache = new Map<string, CachedToken>();

/** Margen de seguridad: renovar 5 minutos antes de que expire */
const EXPIRY_MARGIN_MS = 5 * 60 * 1000;

/**
 * Lock de deduplicación: si ya hay una solicitud de token en vuelo para un host,
 * las peticiones concurrentes esperan la misma promesa en lugar de disparar
 * solicitudes duplicadas a Salesforce.
 */
const pendingRequests = new Map<string, Promise<OcapiTokenResponse>>();

function getCachedToken(host: string): string | null {
  const cached = tokenCache.get(host);
  if (!cached) return null;

  // Si el token está a punto de expirar, descartarlo
  if (Date.now() >= cached.expiresAt - EXPIRY_MARGIN_MS) {
    tokenCache.delete(host);
    return null;
  }

  return cached.accessToken;
}

function setCachedToken(host: string, token: string, expiresInSeconds: number): void {
  tokenCache.set(host, {
    accessToken: token,
    expiresAt: Date.now() + expiresInSeconds * 1000,
  });
}

// ==================== Public API ====================

export async function getAccessToken(host: string): Promise<OcapiTokenResponse> {
  // 1. Verificar si hay un token válido en caché para este host
  const cached = getCachedToken(host);
  if (cached) {
    return { access_token: cached, expires_in: 0, token_type: "Bearer" };
  }

  // 2. Si ya hay una solicitud en vuelo para este host, esperar su resultado
  const pending = pendingRequests.get(host);
  if (pending) {
    return pending;
  }

  // 3. Crear la promesa de solicitud y registrarla como "en vuelo"
  const requestPromise = fetchNewToken(host);
  pendingRequests.set(host, requestPromise);

  try {
    const result = await requestPromise;
    return result;
  } finally {
    // Limpiar el lock sin importar si falló o no
    pendingRequests.delete(host);
  }
}

/** Invalida el token en caché para un host específico (por ejemplo, tras un 401/403) */
export function invalidateToken(host: string): void {
  tokenCache.delete(host);
}

// ==================== Internal ====================

async function fetchNewToken(host: string): Promise<OcapiTokenResponse> {
  const clientId = process.env.OCAPI_CLIENT_ID || process.env["ocapi-client-id"] || process.env.ocapi_client_id;
  const clientPassword = process.env.OCAPI_CLIENT_PASSWORD || process.env["ocapi-client-password"] || process.env.ocapi_client_password;
  const bmUsername = process.env.OCAPI_BM_USERNAME || process.env.bm_username || process.env.bm_username;
  const bmPassword = process.env.OCAPI_BM_PASSWORD || process.env.bm_password || process.env.bm_password;

  if (!clientId || !clientPassword || !bmUsername || !bmPassword) {
    throw new Error(`Faltan credenciales de OCAPI en las variables de entorno. Leídas: clientId=${!!clientId}, clientPassword=${!!clientPassword}, bmUsername=${!!bmUsername}, bmPassword=${!!bmPassword}`);
  }

  const rawCredentials = `${bmUsername}:${bmPassword}:${clientPassword}`;
  const base64Credentials = Buffer.from(rawCredentials).toString("base64");

  const response = await fetch(
    `https://${host}/dw/oauth2/access_token?client_id=${clientId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${base64Credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=urn:demandware:params:oauth:grant-type:client-id:dwsid:dwsecuretoken",
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to get access token for ${host}: ${response.status} ${errorText}`
    );
  }

  const tokenData = await response.json() as OcapiTokenResponse;

  // Guardar en caché. expires_in de OCAPI suele ser ~1800 segundos (30 min)
  const expiresIn = tokenData.expires_in || 1800;
  setCachedToken(host, tokenData.access_token, expiresIn);

  return tokenData;
}

