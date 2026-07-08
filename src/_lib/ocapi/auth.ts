import "server-only";
import type { OcapiTokenResponse } from "@/_lib/definitions";

// ==================== Token Cache (por tienda) ====================
// Cada tienda (host OCAPI) tiene su propio token en caché, ya que el
// access_token que emite OCAPI queda ligado al host con el que se pidió.
// Se reutiliza hasta que esté por vencer: nunca se vuelve a pedir por
// refrescar la página, cambiar de tienda en el UI o por el polling en
// tiempo real — solo cuando expira o Salesforce lo rechaza (401/403).

interface CachedToken {
  accessToken: string;
  expiresAt: number; // timestamp en ms
}

const tokenCache = new Map<string, CachedToken>();

/** Margen de seguridad: renovar 2 minutos antes de que expire */
const EXPIRY_MARGIN_MS = 2 * 60 * 1000;

/**
 * Lock de deduplicación por host: si ya hay una solicitud de token en
 * vuelo para una tienda, las peticiones concurrentes (ej. Promise.all
 * de varias tiendas, o pollings simultáneos) esperan la misma promesa
 * en lugar de disparar solicitudes duplicadas a Salesforce.
 */
const pendingRequests = new Map<string, Promise<OcapiTokenResponse>>();

// ==================== Public API ====================

/**
 * Obtiene el token de acceso OCAPI para una tienda específica, usando
 * caché en memoria por host hasta que esté por vencer.
 * @param host - Host OCAPI de la tienda (ej. www.patprimo.com)
 */
export async function getAccessToken(host: string): Promise<OcapiTokenResponse> {
  // 1. Verificar si hay un token válido en caché para este host
  const cached = tokenCache.get(host);
  if (cached && Date.now() < cached.expiresAt - EXPIRY_MARGIN_MS) {
    return { access_token: cached.accessToken, expires_in: 0, token_type: "Bearer" };
  }

  // 2. Si ya hay una solicitud en vuelo para este host, esperar su resultado
  const pending = pendingRequests.get(host);
  if (pending) {
    return pending;
  }

  // 3. Crear la promesa de solicitud y registrarla como "en vuelo" para este host
  const requestPromise = fetchNewToken(host);
  pendingRequests.set(host, requestPromise);

  try {
    const result = await requestPromise;
    return result;
  } finally {
    pendingRequests.delete(host);
  }
}

/** Invalida el token en caché de una tienda específica (ej. tras un 401/403) */
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
      `Failed to get access token from ${host}: ${response.status} ${errorText}`
    );
  }

  const tokenData = await response.json() as OcapiTokenResponse;

  // Guardar en caché para este host. Usar expires_in de la respuesta, o 1800s (30 min) por defecto
  const expiresIn = tokenData.expires_in || 1800;
  tokenCache.set(host, {
    accessToken: tokenData.access_token,
    expiresAt: Date.now() + expiresIn * 1000,
  });

  return tokenData;
}


