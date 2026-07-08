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

    // 2. Consultar pedidos en paralelo para cada tienda, cada una con su
    //    propio token en caché por host (evita spam de peticiones a Salesforce)
    const results = await Promise.all(
      stores.map(async (store) => {
        try {
          const tokenRes = await getAccessToken(store.ocapi_host);
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
          // Si el error es 401 o 403, el token de esta tienda puede estar
          // expirado. Invalidar su caché y reintentar UNA sola vez con un
          // token fresco, sin afectar el token cacheado de las demás tiendas.
          if (orderErr.message?.includes("(401)") || orderErr.message?.includes("(403)")) {
            try {
              invalidateToken(store.ocapi_host);
              const freshToken = await getAccessToken(store.ocapi_host);

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


