import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/_lib/supabase/server";
import { getAccessToken } from "@/_lib/ocapi/auth";
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

    // 2. Consultar pedidos en paralelo para cada tienda
    const results = await Promise.all(
      stores.map(async (store) => {
        try {
          // Obtener token
          const tokenRes = await getAccessToken(store.ocapi_host);
          
          // Consultar pedidos pendientes
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
        } catch (err: any) {
          console.error(`Error consultando tienda ${store.name}:`, err);
          return {
            storeId: store.id,
            storeName: store.name,
            success: false,
            ordersCount: 0,
            orders: [],
            error: err.message || "Error al conectar con la tienda"
          };
        }
      })
    );

    return NextResponse.json({ stores: results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
