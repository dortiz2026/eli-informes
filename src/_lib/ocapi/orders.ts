import "server-only";
import { getAccessToken } from "./auth";
import type { OcapiOrderSearchResponse, PendingOrderInfo } from "@/_lib/definitions";

const PAGE_SIZE = 200; // Máximo que permite OCAPI por página

function buildQuery(start: number) {
  return {
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
    count: PAGE_SIZE,
    start,
    select: "(count,total,hits.(data.(order_no,export_status,status,creation_date,order_total,payment_status,shipping_status,confirmation_status,site_id,shipments.(shipment_id,shipping_method.(id,name),shipping_address.(city)),billing_address.(city))))"
  };
}

function mapHits(hits: OcapiOrderSearchResponse["hits"]): PendingOrderInfo[] {
  return hits.map(hit => {
    const o = hit.data;
    const city = o.shipments?.[0]?.shipping_address?.city || o.billing_address?.city || "Desconocida";
    const shipping_method = o.shipments?.[0]?.shipping_method?.name || o.shipments?.[0]?.shipping_method?.id || "Estándar";
    return {
      order_no: o.order_no,
      creation_date: o.creation_date,
      order_total: o.order_total,
      payment_status: o.payment_status,
      shipping_status: o.shipping_status,
      city,
      shipping_method
    };
  });
}

async function fetchPage(url: string, accessToken: string, start: number): Promise<OcapiOrderSearchResponse> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`
    },
    body: JSON.stringify(buildQuery(start)),
    cache: "no-store"
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OCAPI order search error (${response.status}): ${errorText}`);
  }

  return response.json() as Promise<OcapiOrderSearchResponse>;
}

export async function searchPendingOrders(
  host: string,
  site: string,
  accessToken: string
): Promise<PendingOrderInfo[]> {
  const url = `https://${host}/s/${site}/dw/shop/v22_4/order_search`;

  // Primera página
  const firstPage = await fetchPage(url, accessToken, 0);

  if (!firstPage.hits || firstPage.hits.length === 0) {
    return [];
  }

  const allOrders = mapHits(firstPage.hits);
  const total = firstPage.total;

  // Si hay más páginas, traerlas en paralelo
  if (total > PAGE_SIZE) {
    const remainingStarts: number[] = [];
    for (let start = PAGE_SIZE; start < total; start += PAGE_SIZE) {
      remainingStarts.push(start);
    }

    const pages = await Promise.all(
      remainingStarts.map(start => fetchPage(url, accessToken, start))
    );

    for (const page of pages) {
      if (page.hits) {
        allOrders.push(...mapHits(page.hits));
      }
    }
  }

  return allOrders;
}
