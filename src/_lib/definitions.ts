import * as z from "zod";

// ==================== Database Types ====================

export interface User {
  id: string;
  email: string;
  password_hash: string | null;
  name: string;
  role: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Store {
  id: string;
  name: string;
  ocapi_host: string;
  ocapi_site: string;
  is_active: boolean;
  created_at: string;
}

export interface Service {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  icon: string;
  created_at: string;
}

// ==================== OCAPI Types ====================

export interface OcapiTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export interface OrderHit {
  order_no: string;
  export_status: string;
  status: string;
  creation_date: string;
  order_total: number;
  payment_status: string;
  shipping_status: string;
  confirmation_status: string;
  site_id: string;
  shipments: Array<{
    shipment_id: string;
    shipping_method: {
      id: string;
      name: string;
    };
    shipping_address: {
      city: string;
    };
  }>;
  billing_address: {
    city: string;
  };
}

export interface OrderSearchResponse {
  count: number;
  total: number;
  hits: Array<{
    data: OrderHit;
  }>;
}

export type OcapiOrderSearchResponse = OrderSearchResponse;

export interface PendingOrderInfo {
  order_no: string;
  creation_date: string;
  order_total: number;
  payment_status: string;
  shipping_status: string;
  city: string;
  shipping_method: string;
}

export interface StoreOrdersResult {
  store: Store;
  orders: OrderHit[];
  total: number;
  error: string | null;
  lastUpdated: string;
}

// ==================== Session Types ====================

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
  expiresAt: Date;
}

// ==================== Form Schemas ====================

export const LoginSchema = z.object({
  email: z
    .string()
    .min(1, { message: "El email es requerido" })
    .email({ message: "Ingresa un email válido" })
    .refine((email) => email.endsWith("@patprimo.com.co"), {
      message: "Solo se permiten correos con dominio @patprimo.com.co",
    }),
  password: z
    .string()
    .min(1, { message: "La contraseña es requerida" }),
});

export const SetPasswordSchema = z
  .object({
    email: z
      .string()
      .min(1, { message: "El email es requerido" })
      .email({ message: "Ingresa un email válido" })
      .refine((email) => email.endsWith("@patprimo.com.co"), {
        message: "Solo se permiten correos con dominio @patprimo.com.co",
      }),
    password: z
      .string()
      .min(8, { message: "Mínimo 8 caracteres" })
      .regex(/[a-zA-Z]/, { message: "Debe contener al menos una letra" })
      .regex(/[0-9]/, { message: "Debe contener al menos un número" })
      .regex(/[^a-zA-Z0-9]/, {
        message: "Debe contener al menos un carácter especial",
      }),
    confirmPassword: z.string().min(1, { message: "Confirma tu contraseña" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type LoginFormState =
  | {
      errors?: {
        email?: string[];
        password?: string[];
      };
      message?: string;
    }
  | undefined;

export type SetPasswordFormState =
  | {
      errors?: {
        password?: string[];
        confirmPassword?: string[];
      };
      message?: string;
    }
  | undefined;
