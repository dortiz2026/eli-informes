import "server-only";
import type { OcapiTokenResponse } from "@/_lib/definitions";

// ==================== Token Cache (Global Único) ====================
// El access_token de OCAPI NO está ligado a una tienda: un mismo token
// sirve para consultar cualquiera de las tiendas configuradas. Por eso
// se cachea UNA sola vez en memoria y se reutiliza para todas, hasta
// que esté por vencer: nunca se vuelve a pedir por refrescar la página,
// cambiar de tienda en el UI o por el polling en tiempo real — solo
// cuando expira o Salesforce lo rechaza (401/403).

interface CachedToken {
  accessToken: string;
  expiresAt: number; // timestamp en ms
}

let cachedToken: CachedToken | null = null;

/** Margen de seguridad: renovar 2 minutos antes de que expire */
const EXPIRY_MARGIN_MS = 2 * 60 * 1000;

/**
 * Lock de deduplicación: si ya hay una solicitud de token en vuelo
 * (ej. varias tiendas consultadas en paralelo, o pollings simultáneos),
 * las peticiones concurrentes esperan la misma promesa en lugar de
 * disparar solicitudes duplicadas a Salesforce.
 */
let pendingRequest: Promise<OcapiTokenResponse> | null = null;

// ==================== Public API ====================

/**
 * Obtiene el token de acceso OCAPI global, usando caché en memoria
 * hasta que esté por vencer.
 * @param host - Host de cualquier tienda (solo se usa si hay que pedir un token nuevo)
 */
export async function getAccessToken(host: string): Promise<OcapiTokenResponse> {
  // 1. Verificar si hay un token válido en caché
  if (cachedToken && Date.now() < cachedToken.expiresAt - EXPIRY_MARGIN_MS) {
    return { access_token: cachedToken.accessToken, expires_in: 0, token_type: "Bearer" };
  }

  // 2. Si ya hay una solicitud en vuelo, esperar su resultado
  if (pendingRequest) {
    return pendingRequest;
  }

  // 3. Crear la promesa de solicitud y registrarla como "en vuelo"
  pendingRequest = fetchNewToken(host);

  try {
    const result = await pendingRequest;
    return result;
  } finally {
    pendingRequest = null;
  }
}

/** Invalida el token en caché (ej. tras un 401/403) */
export function invalidateToken(): void {
  cachedToken = null;
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

  // Guardar en caché global. Usar expires_in de la respuesta, o 1800s (30 min) por defecto
  const expiresIn = tokenData.expires_in || 1800;
  cachedToken = {
    accessToken: tokenData.access_token,
    expiresAt: Date.now() + expiresIn * 1000,
  };

  return tokenData;
}


