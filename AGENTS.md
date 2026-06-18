<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Proyecto: Dashboard de Monitoreo en Tiempo Real — Informes

## Descripción General

Dashboard de monitoreo en tiempo real para consultar pedidos pendientes de 4 tiendas e-commerce (Salesforce Commerce Cloud / OCAPI). El proyecto está diseñado para ser extensible, permitiendo agregar nuevas funcionalidades (servicios) en el futuro.

---

## Stack Tecnológico

- **Framework**: Next.js (App Router) con TypeScript
- **Estilos**: Tailwind CSS v4 — Mobile First
- **Base de datos / Auth**: Supabase (via MCP para gestión de tablas)
- **Paleta de colores**: Gris, Negro y Blanco (diseño minimalista y premium)
- **Fuente**: Inter (Google Fonts)

---

## Tiendas Configuradas

| Host OCAPI (`ocapi-instance-host`) | Site OCAPI (`ocapi-site`) |
|-------------------------------------|---------------------------|
| `www.patprimo.com`                  | `PatPrimo`                |
| `www.sevenseven.com`                | `SevenSeven`              |
| `www.ostu.com`                      | `Ostu`                    |
| `www.atmosmovement.com`             | `Atmos`                   |

---

## Arquitectura de Carpetas

```
src/
├── app/
│   ├── (auth)/                    # Route group: páginas públicas de autenticación
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── set-password/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/               # Route group: páginas protegidas del dashboard
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── consultar-pendientes/
│   │   │   └── page.tsx
│   │   └── layout.tsx             # Layout con sidebar colapsable
│   ├── api/
│   │   ├── auth/
│   │   │   └── route.ts
│   │   └── ocapi/
│   │       ├── token/
│   │       │   └── route.ts       # Obtener access_token OCAPI por tienda
│   │       └── orders/
│   │           └── route.ts       # Consultar pedidos pendientes
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Redirect a /login o /dashboard
│   └── globals.css
├── _components/                   # Componentes compartidos (UI)
│   ├── sidebar/
│   ├── topbar/
│   ├── cards/
│   └── tables/
├── _lib/                          # Lógica de negocio y utilidades
│   ├── supabase/
│   │   ├── client.ts              # Cliente Supabase (browser)
│   │   ├── server.ts              # Cliente Supabase (server)
│   │   └── middleware.ts          # Helper para middleware de auth
│   ├── ocapi/
│   │   ├── auth.ts                # Lógica de autenticación OCAPI
│   │   └── orders.ts              # Lógica de consulta de pedidos
│   ├── definitions.ts             # Tipos TypeScript y schemas Zod
│   └── utils.ts                   # Funciones utilitarias
├── _hooks/                        # Custom React hooks
│   └── use-realtime.ts            # Hook para polling en tiempo real
└── middleware.ts                   # Next.js middleware (protección de rutas)
```

---

## Reglas de Desarrollo

### Variables de Entorno
- **NINGUNA** variable, credencial, URL o secreto debe estar hardcodeada en el código.
- Todas las variables deben estar en `.env.local` (desarrollo) o `.env` (producción).
- Las variables del lado del cliente deben llevar el prefijo `NEXT_PUBLIC_`.
- Variables requeridas:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# OCAPI Credentials
OCAPI_CLIENT_ID=
OCAPI_CLIENT_PASSWORD=
OCAPI_BM_USERNAME=
OCAPI_BM_PASSWORD=

# Session
SESSION_SECRET=
```

### Base de Datos (Supabase)
- **Todo debe estar en base de datos**. No se permiten datos quemados, temporales ni mocks.
- Usar MCP de Supabase para crear y gestionar tablas.
- Tablas requeridas:

#### `users`
| Columna         | Tipo        | Notas                                    |
|-----------------|-------------|------------------------------------------|
| `id`            | `uuid` (PK) | Default: `gen_random_uuid()`             |
| `email`         | `text`       | Unique. Solo dominios `@patprimo.com.co` |
| `password_hash` | `text`       | Nullable (se asigna después del registro)|
| `name`          | `text`       |                                          |
| `role`          | `text`       | Default: `'viewer'`                      |
| `is_verified`   | `boolean`    | Default: `false`                         |
| `created_at`    | `timestamptz`| Default: `now()`                         |
| `updated_at`    | `timestamptz`| Default: `now()`                         |

#### `stores`
| Columna            | Tipo        | Notas                         |
|--------------------|-------------|-------------------------------|
| `id`               | `uuid` (PK) | Default: `gen_random_uuid()` |
| `name`             | `text`       | Ej: `PatPrimo`              |
| `ocapi_host`       | `text`       | Ej: `www.patprimo.com`      |
| `ocapi_site`       | `text`       | Ej: `PatPrimo`              |
| `is_active`        | `boolean`    | Default: `true`              |
| `created_at`       | `timestamptz`| Default: `now()`             |

#### `services`
| Columna       | Tipo        | Notas                               |
|---------------|-------------|---------------------------------------|
| `id`          | `uuid` (PK) | Default: `gen_random_uuid()`         |
| `name`        | `text`       | Ej: `Consultar Pendientes`          |
| `slug`        | `text`       | Unique. Ej: `consultar-pendientes`  |
| `description` | `text`       |                                      |
| `is_active`   | `boolean`    | Default: `true`                      |
| `icon`        | `text`       | Nombre del ícono para el sidebar     |
| `created_at`  | `timestamptz`| Default: `now()`                     |

### Autenticación
- Solo se permiten correos con dominio `@patprimo.com.co`.
- Flujo:
  1. Login con email → verificación de dominio.
  2. Si el usuario no existe, se registra automáticamente con `is_verified = false`.
  3. Se envía verificación (email o código).
  4. Página de asignación de contraseña (tras primer registro).
  5. Sesión persistente con cookies HttpOnly.
- Usar Supabase Auth o sesiones con JWT (jose).

### Diseño UI/UX
- **Mobile First** obligatorio en todo componente.
- Paleta: Gris (`#1a1a1a`, `#2a2a2a`, `#3a3a3a`, `#e5e5e5`, `#f5f5f5`), Negro (`#000`, `#0a0a0a`), Blanco (`#fff`, `#fafafa`).
- Dashboard con **sidebar colapsable** (ícono hamburguesa en móvil).
- **Animaciones fluidas** con CSS transitions y `framer-motion` o CSS keyframes.
- Tipografía: Inter (Google Fonts).

### Funcionalidad 1: Consultar Pendientes
- Servicio basado en la colección Postman (`My_Collection.postman_collection.json`).
- **Paso 1**: Obtener `access_token` por tienda:
  - `POST https://{host}/dw/oauth2/access_token?client_id={client_id}`
  - Header: `Authorization: Basic base64({username}:{password}:{client_password})`
  - Body: `grant_type=urn:demandware:params:oauth:grant-type:client-id:dwsid:dwsecuretoken`
- **Paso 2**: Consultar pedidos pendientes por tienda:
  - `POST https://{host}/s/{site}/dw/shop/v23_2/order_search`
  - Header: `Authorization: Bearer {access_token}`
  - Filtros: `payment_status=paid`, `export_status=ready`, `c_orderStatus=2`, `status≠cancelled`
  - Campos: `order_no`, `creation_date`, `order_total`, `payment_status`, `shipping_status`, `city`, `shipping_method`
- **Monitoreo en tiempo real**: Polling asíncrono cada N segundos configurable.
- Cada tienda se consulta en paralelo (Promise.all).

### Código
- TypeScript estricto. No usar `any`.
- Componentes del servidor por defecto. Solo `'use client'` cuando sea necesario.
- Imports con alias `@/` desde `src/`.
- Carpetas privadas con prefijo `_` (ej: `_components`, `_lib`, `_hooks`).
- Validación de datos con Zod.
- Manejo de errores con `error.tsx` y `loading.tsx` en cada ruta.

---

## Servicios Futuros (Placeholder)

El menú lateral debe ser dinámico y alimentado desde la tabla `services`. A medida que se agreguen nuevos servicios, solo se necesita:
1. Insertar un registro en `services`.
2. Crear la carpeta de ruta en `(dashboard)/`.
3. Implementar la lógica en `_lib/`.
