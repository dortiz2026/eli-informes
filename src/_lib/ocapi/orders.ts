import "server-only";
import { getAccessToken } from "./auth";
import type { OcapiOrderSearchResponse, PendingOrderInfo } from "@/_lib/definitions";

export async function searchPendingOrders(
  host: string,
  site: string,
  accessToken: string
): Promise<PendingOrderInfo[]> {
  const url = `https://${host}/s/${site}/dw/shop/v22_4/order_search`;
  
  const body = {
    query: {
      bool_query: {
        must: [
          {
            term_query: {
              fields: ["payment_status"],
              operator: "is",
              values: ["paid"]
            }
          },
          {
            term_query: {
              fields: ["export_status"],
              operator: "is",
              values: ["ready"]
            }
          },
          {
            term_query: {
              fields: ["c_orderStatus"],
              operator: "is",
              values: ["2"]
            }
          },
          {
            bool_query: {
              must_not: [
                {
                  term_query: {
                    fields: ["status"],
                    operator: "is",
                    values: ["cancelled"]
                  }
                }
              ]
            }
          }
        ]
      }
    },
    select: "(count,total,hits.(data.(order_no,export_status,status,creation_date,order_total,payment_status,shipping_status,confirmation_status,site_id,shipments.(shipment_id,shipping_method.(id,name),shipping_address.(city)),billing_address.(city))))"
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`
    },
    body: JSON.stringify(body),
    // Pedidos en tiempo real, no cachear
    cache: "no-store"
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OCAPI order search error (${response.status}): ${errorText}`);
  }

  const data: OcapiOrderSearchResponse = await response.json();
  
  if (!data.hits) {
    return [];
  }

  return data.hits.map(hit => {
    const o = hit.data;
    // Resolver ciudad y método de envío desde el shipment o fallback a properties planas si existen
    const city = o.shipments?.[0]?.shipping_address?.city || o.billing_address?.city || "Desconocida";
    const shipping_method = o.shipments?.[0]?.shipping_method?.name || o.shipments?.[0]?.shipping_method?.id || "Estándar";

    return {
      order_no: o.order_no,
      creation_date: o.creation_date,
      order_total: o.order_total,
      payment_status: o.payment_status,
      shipping_status: o.shipping_status,
      city: city,
      shipping_method: shipping_method
    };
  });
}
