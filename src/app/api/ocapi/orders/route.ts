import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/_lib/supabase/server";
import { getAccessToken, invalidateToken } from "@/_lib/ocapi/auth";
import { searchPendingOrders } from "@/_lib/ocapi/orders";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Obtener todas las tiendas activas de la base de datos
    const { data: stores, error: storesError } = await supabase
      .from("stores")
      .select("*")
      .eq("is_active", true);

    if (storesError) {
      return NextResponse.json({ error: storesError.message }, { status: 500 });
    }

    if (!stores || stores.length === 0) {
      return NextResponse.json({ stores: [] });
    }

    // 2. Obtener UN SOLO token global (el mismo access_token sirve para
    //    consultar cualquiera de las tiendas, no está ligado al host)
    const tokenRes = await getAccessToken(stores[0].ocapi_host);

    // 3. Consultar pedidos en paralelo para cada tienda usando el mismo
    //    token. Cada callback usa su propia constante local (nunca muta
    //    una variable compartida) para no pisar el token que estén
    //    usando las demás tiendas en paralelo.
    const results = await Promise.all(
      stores.map(async (store) => {
        try {
          const orders = await searchPendingOrders(
            store.ocapi_host,
            store.ocapi_site,
            tokenRes.access_token
          );

          return {
            storeId: store.id,
            storeName: store.name,
            success: true,
            ordersCount: orders.length,
            orders: orders,
            error: null
          };
        } catch (orderErr: any) {
          // Solo un 401 (Unauthorized) indica que el token realmente expiró.
          // Invalidar caché y reintentar UNA sola vez con un token fresco.
          // El lock de deduplicación en getAccessToken() asegura que, aunque
          // varias tiendas fallen al mismo tiempo, solo se pida UN token
          // nuevo a Salesforce (las demás reutilizan esa misma promesa).
          //
          // Un 403 NO dispara este flujo: puede ser un bloqueo de Cloudflare
          // (challenge/WAF) específico de esa tienda, y pedir un token nuevo
          // no lo soluciona — solo tiraría a la basura el token global que
          // las demás tiendas SÍ están usando con éxito, y volvería a golpear
          // el endpoint bloqueado en cada polling, empeorando el bloqueo.
          if (orderErr.message?.includes("(401)")) {
            try {
              invalidateToken();
              // Reintentar SIEMPRE contra el host de la primera tienda (el
              // mismo usado para el token inicial), nunca contra store.ocapi_host:
              // así jamás se vuelve a golpear directamente el endpoint de
              // token de una tienda que pueda estar bloqueada (ej. Cloudflare).
              const freshToken = await getAccessToken(stores[0].ocapi_host);

              const orders = await searchPendingOrders(
                store.ocapi_host,
                store.ocapi_site,
                freshToken.access_token
              );

              return {
                storeId: store.id,
                storeName: store.name,
                success: true,
                ordersCount: orders.length,
                orders: orders,
                error: null
              };
            } catch (retryErr: any) {
              console.error(`Error en retry para tienda ${store.name}:`, retryErr);
              return {
                storeId: store.id,
                storeName: store.name,
                success: false,
                ordersCount: 0,
                orders: [],
                error: retryErr.message || "Error al conectar con la tienda"
              };
            }
          }

          console.error(`Error consultando tienda ${store.name}:`, orderErr);
          return {
            storeId: store.id,
            storeName: store.name,
            success: false,
            ordersCount: 0,
            orders: [],
            error: orderErr.message || "Error al conectar con la tienda"
          };
        }
      })
    );

    return NextResponse.json({ stores: results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


