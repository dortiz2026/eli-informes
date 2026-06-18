import "server-only";
import type { OcapiTokenResponse } from "@/_lib/definitions";

export async function getAccessToken(host: string): Promise<OcapiTokenResponse> {
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

  return response.json() as Promise<OcapiTokenResponse>;
}
