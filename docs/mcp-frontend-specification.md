# Especificación de Comunicación Front-End (Guía MCP)

Este documento sirve como especificación y mapa de contexto (Model Context Protocol / Context Guide) para el código base del Front-End del sistema de pantalla de cocina y gestión administrativa del restaurante **Santo Bocado**.

---

## 1. Arquitectura y Stack Tecnológico

* **Framework:** React 19 (montado con Vite)
* **Estilos:** Tailwind CSS v4 con utilidades de `clsx` y `tailwind-merge` (estilo Shadcn UI).
* **Gestor de paquetes:** pnpm / npm
* **Estructura principal:**
  * `src/App.tsx`: Contenedor principal de la pantalla de cocina (Pedidos) y componentes de Reservas.
  * `src/components/ui`: Componentes reutilizables de UI (Botones, Tarjetas, Badges, etc).
  * `src/services/api.ts`: Capa de conexión HTTP y Server-Sent Events (SSE) con el back-end.

---

## 2. Modelos de Datos Relevantes en el Cliente

El Front-End tipa los datos recibidos del back-end mediante interfaces en TypeScript (ver `api.ts`):

### 📋 Pedido (`Pedido`)
* **id:** `string` (UUID)
* **estado:** `'pendiente' | 'confirmado' | 'en_preparacion' | 'entregado' | 'cancelado'`
* **tipo:** `'delivery' | 'recoger'`
* **numero_pedido:** `number`
* **subtotal / total:** `string`
* **cliente_nombre / cliente_telefono:** `string | null`
* **productos:** Array de `Producto` (incluye cantidad, nombre, extras y notas).

### 📅 Reserva (`Reserva`)
* **id:** `string`
* **cliente_nombre / cliente_telefono:** `string`
* **fecha / hora:** `string`
* **num_personas:** `number`
* **estado:** `string`
* **notas:** `string | null`

---

## 3. Integración con el Back-End (API y SSE)

El front-end se comunica exclusivamente con los dos servidores back-end definidos en la especificación MCP del servidor.

### Obtención y Mutación de Datos (HTTP)
* **Pedidos:** `GET /api/pedidos` para inicializar la lista de la cocina.
* **Mutación de Pedidos:** `PATCH /api/pedidos/:id` para cambiar estados de los pedidos (ej. de `pendiente` a `en_preparacion`).
* **Reservas:** `GET /api/reservas?fecha={HOY}&estado=pendiente`
* **Mutación de Reservas:** `PATCH /api/webhooks/reservas/:id` (Nota: este endpoint pertenece al servidor de N8N en el puerto 3002, orquestando las respuestas de automatización).

### Sincronización en Tiempo Real (SSE)
Para evitar recargar la página, se establece una conexión persistente de `EventSource` hacia el endpoint `/api/pedidos/stream`.
* **Eventos escuchados:**
  * `nuevo_pedido`: Inyecta un pedido entrante al inicio del estado de React (`App.tsx`).
  * `pedido_actualizado`: Modifica los datos (ej. cambio de estado o productos) de un pedido existente.
  * `pedido_eliminado`: Remueve el pedido de la vista si es eliminado o archivado.

---

## 4. Hallazgos y Reglas de Desarrollo Críticas

1. **Evitar Hardcodeo de localhost:** Las llamadas a `fetch` e `EventSource` en `api.ts` **deben** utilizar rutas relativas (ej. `/api/pedidos`) en lugar de `http://localhost:3001`. Esto asegura que al desplegar con Docker+Traefik, el front-end y el back-end puedan comunicarse sin importar el dominio público.
2. **Gestión de Estado Centralizada:** Actualmente todo el estado de `pedidos` vive en `App.tsx`. Al escalar, considerar React Context, Redux o Zustand si se agregan más pantallas (ej. pantalla de empaque, pantalla de meseros).
3. **Manejo de Errores de Red:** La UI implementa una capa de carga (`loading`), pero debe agregarse resiliencia a la conexión SSE en caso de pérdida de internet en la cocina (auto-reconexión).
