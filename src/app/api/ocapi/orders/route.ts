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

    // 2. Obtener UN SOLO token global (sirve para todas las tiendas)
    const tokenRes = await getAccessToken(stores[0].ocapi_host);
    let accessToken = tokenRes.access_token;

    // 3. Consultar pedidos en paralelo para cada tienda usando el mismo token
    const results = await Promise.all(
      stores.map(async (store) => {
        try {
          const orders = await searchPendingOrders(
            store.ocapi_host,
            store.ocapi_site,
            accessToken
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
          // Solo un 401 (Unauthorized) significa que el token realmente expiró:
          // invalidar el caché global y reintentar UNA sola vez con un token fresco,
          // pedido SIEMPRE contra el host de la primera tienda (host estable), nunca
          // contra el host de la tienda que falló.
          //
          // Un 403 NO renueva el token: suele ser un bloqueo de Cloudflare/WAF
          // propio de esa tienda. Borrar el token global (que las demás usan bien)
          // y volver a golpear el endpoint bloqueado no lo arregla y empeora el
          // bloqueo. Se reporta como error de esa tienda y se sigue.
          if (orderErr.message?.includes("(401)")) {
            try {
              invalidateToken();
              const freshToken = await getAccessToken(stores[0].ocapi_host);
              accessToken = freshToken.access_token;

              const orders = await searchPendingOrders(
                store.ocapi_host,
                store.ocapi_site,
                accessToken
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


