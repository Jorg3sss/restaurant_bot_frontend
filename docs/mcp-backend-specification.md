# Especificación de Comunicación Back-End (Guía MCP para Agente Front-End)
Este documento sirve como especificación y mapa de contexto (Model Context Protocol / Context Guide) para que el agente del front-end o cualquier desarrollador comprenda cómo interactuar con el back-end del sistema de bot conversacional y pantalla de cocina del restaurante **Santo Bocado**.

---

## 1. Arquitectura de Servidores y Puertos

El back-end está dividido en **dos servidores Express independientes** que corren sobre el mismo entorno, dividiendo las responsabilidades operativas:

### 🖥️ Servidor de Cocina (Kitchen/Main Server)
* **Puerto por defecto:** `3001`
* **URL Base:** `http://localhost:3001/api`
* **Responsabilidad:** Gestiona la pantalla de cocina en tiempo real, el menú completo, la disponibilidad de los productos y las reservas en el panel administrativo.
* **Características especiales:** Emite eventos en tiempo real a través de **Server-Sent Events (SSE)**.

### 🤖 Servidor de Webhooks N8N (N8N Backend Server)
* **Puerto por defecto:** `3002`
* **URL Base:** `http://localhost:3002/api/webhooks`
* **Responsabilidad:** Provee los endpoints de webhook que el bot de n8n (orquestado por WhatsApp Business API y el agente GPT-4o) consume para crear clientes, registrar mensajes de chat, guardar/modificar reservas y subir pedidos conversacionales.

---

## 2. Modelos de Datos Relevantes (Esquema Prisma/PostgreSQL)

Los modelos principales que el front-end maneja o consulta son:

### 📋 Pedido (`pedido` / `pedido_detalle`)
* **id:** `UUID` (String)
* **numero_pedido:** `Int` (Autoincremental por base de datos o aleatorio en pruebas)
* **estado:** `'pendiente' | 'confirmado' | 'en_preparacion' | 'entregado' | 'cancelado'`
* **tipo:** `'delivery' | 'recoger'`
* **metodo_pago:** `'efectivo' | 'transferencia' | 'tarjeta'`
* **subtotal:** `Decimal`
* **costo_envio:** `Decimal | null` (Ej. en Umán es de ~$10 para delivery)
* **total:** `Decimal`
* **created_at:** `DateTime`
* **cliente_nombre:** `String | null`
* **cliente_telefono:** `String | null`
* **productos:** Array de productos solicitados en el pedido:
  * **producto_id:** `UUID` (String)
  * **nombre:** `String`
  * **cantidad:** `Int`
  * **precio_unitario:** `Decimal`
  * **subtotal:** `Decimal`
  * **notas:** `String | null` (Notas especiales del platillo, ej: *"Sin cebolla"*)
  * **extras:** Array de strings con los nombres históricos de los modificadores cobrados (ej. `["Extra Queso", "Extra Tocino"]`).

### 🍔 Producto y Menú (`producto` / `categoria`)
* **id:** `UUID` (String)
* **categoria_id:** `UUID`
* **nombre:** `String`
* **descripcion:** `String | null`
* **ingredientes:** `String | null`
* **precio:** `Decimal`
* **imagen_url:** `String | null`
* **activo:** `Boolean` (Determina la disponibilidad del producto en el menú y si el Bot de WhatsApp lo ofrece).

### 📅 Reserva (`reserva`)
* **id:** `UUID` (String)
* **restaurante_id:** `UUID`
* **cliente_id:** `UUID`
* **mesa_id:** `UUID | null`
* **fecha:** `Date` (Formato: `YYYY-MM-DD`)
* **hora:** `Time` (Formato: `HH:MM:SS`)
* **num_personas:** `Int`
* **estado:** `String` (Ej. `pendiente`, `confirmada`, `cancelada`)
* **notas:** `String | null`

---

## 3. Especificación de Endpoints (API Reference)

A continuación se detallan los endpoints agrupados por el servidor correspondiente.

### I. Endpoints del Servidor de Cocina (Puerto 3001)

#### 1. Obtener pedidos del día
* **Método:** `GET`
* **Ruta:** `/api/pedidos`
* **Respuesta exitosa (200 OK):**
```json
{
  "ok": true,
  "data": [
    {
      "id": "c9985641-566b-4372-b3d3-9ae801d3a738",
      "estado": "pendiente",
      "tipo": "delivery",
      "numero_pedido": 105,
      "subtotal": "129.00",
      "total": "139.00",
      "metodo_pago": "efectivo",
      "created_at": "2026-07-16T18:45:00.000Z",
      "cliente_telefono": "9994940808",
      "cliente_nombre": "Isaac",
      "productos": [
        {
          "producto_id": "d0000000-0000-0000-0000-000000000007",
          "nombre": "Hamburguesa Crispy",
          "cantidad": 1,
          "notas": "Sin aderezo",
          "precio_unitario": "129.00",
          "subtotal": "129.00",
          "extras": []
        }
      ]
    }
  ]
}
```

#### 2. Obtener un pedido específico
* **Método:** `GET`
* **Ruta:** `/api/pedidos/:id`
* **Respuesta exitosa (200 OK):** Detalle completo del pedido con la misma estructura.

#### 3. Actualizar estado de un pedido (Flujo de Cocina)
* **Método:** `PATCH`
* **Ruta:** `/api/pedidos/:id`
* **Cuerpo de la petición (JSON):**
```json
{
  "estado": "en_preparacion"
}
```
* **Estados válidos:** `'pendiente', 'confirmado', 'en_preparacion', 'entregado', 'cancelado'`.
* **Efecto colateral:** Emite el evento SSE `pedido_actualizado`.

#### 4. Conectarse al flujo en tiempo real (SSE)
* **Método:** `GET`
* **Ruta:** `/api/pedidos/stream`
* **Encabezado esperado:** `Accept: text/event-stream`
* **Detalles en la sección 4 de este documento.**

#### 5. Obtener menú completo de un restaurante (ordenado por categorías)
* **Método:** `GET`
* **Ruta:** `/api/menu/:restauranteId`
* **Respuesta exitosa (200 OK):**
```json
{
  "ok": true,
  "categorias": [
    {
      "id": "uuid-categoria-1",
      "nombre": "Hamburguesas",
      "descripcion": "Incluyen papas fritas",
      "orden": 1,
      "activo": true,
      "producto": [
        {
          "id": "uuid-producto-1",
          "nombre": "Monster",
          "precio": "159.00",
          "activo": true,
          "producto_modificador": [
            {
              "id": "uuid-mod-1",
              "nombre": "Extra Queso",
              "precio_adicional": "15.00",
              "activo": true
            }
          ]
        }
      ]
    }
  ]
}
```

#### 6. Obtener productos agotados ("no disponibles")
* **Método:** `GET`
* **Ruta:** `/api/productos/no-disponibles/:restauranteId`
* **Respuesta exitosa (200 OK):** `{ "ok": true, "productos": [...] }`

#### 7. Modificar disponibilidad de un producto (Activar / Desactivar)
* **Método:** `PATCH`
* **Ruta:** `/api/productos/:id/disponibilidad`
* **Cuerpo de la petición (JSON):**
```json
{
  "activo": false
}
```
* **⚠️ Ojo / Comportamiento Interno:** El backend implementa este endpoint mediante un interruptor lógico simple (`!producto.activo`). Por ende, llamarlo **cambiará/alternará** el estado actual del producto, ignorando el booleano específico enviado en el body. El front-end debe estar consciente de este comportamiento.

#### 8. Buscar un producto por nombre
* **Método:** `GET`
* **Ruta:** `/api/productos/buscar/:restauranteId?q=NombreDelProducto`

#### 9. Notificación interna de webhook (n8n a Cocina)
* **Método:** `POST`
* **Ruta:** `/api/internal/webhook-notify`
* **Cuerpo de la petición (JSON):**
```json
{
  "tipo": "NUEVO_PEDIDO",
  "pedido_id": "uuid-del-pedido"
}
```
* **Efecto colateral:** Emite el evento SSE `nuevo_pedido`.

---

### II. Endpoints del Servidor Webhook N8N (Puerto 3002)

Estos endpoints son utilizados principalmente por los flujos conversacionales automatizados de n8n, pero pueden ser llamados o integrados por el front-end si requiere simular o interactuar con el flujo conversacional.

#### 1. Registrar pedido desde Bot
* **Método:** `POST`
* **Ruta:** `/api/webhooks/pedidos`
* **Cuerpo de la petición (JSON):** Contiene la información capturada por WhatsApp del cliente. Crea la orden y avisa internamente al servidor de cocina.

#### 2. Modificar pedido activo por Bot
* **Método:** `PATCH`
* **Ruta:** `/api/webhooks/pedidos/:id`
* **Regla:** Solo permitido si el pedido se encuentra en estado `'pendiente'` o `'confirmado'`.

#### 3. Buscar/Crear cliente conversacional
* **Método:** `POST`
* **Ruta:** `/api/webhooks/clientes/find-or-create`

#### 4. Obtener direcciones de un cliente
* **Método:** `GET`
* **Ruta:** `/api/webhooks/clientes/:clienteId/direcciones`
* **Comportamiento especial:** Retorna la lista de direcciones del cliente y destaca en el cálculo cuál es la `"direccionMasUsada"` basándose en compras previas.

#### 5. Obtener contexto unificado para IA (Llamada todo en uno)
* **Método:** `GET`
* **Ruta:** `/api/webhooks/contexto/:restauranteId/:telefono`
* **Uso:** Retorna en una sola petición: información del cliente, productos inactivos (agotados), el estado de la conversación y el historial reciente de chat.

#### 6. Reservar mesa por Bot
* **Método:** `POST`
* **Ruta:** `/api/webhooks/reservas`

#### 7. Modificar reserva activa
* **Método:** `PATCH`
* **Ruta:** `/api/webhooks/reservas/:id`
* **⚠️ Regla de Negocio:** Para poder modificar detalles de una reserva, la petición debe realizarse con **al menos 5 horas de anticipación** respecto a la fecha y hora agendada. De lo contrario, el backend retornará error.

---

## 4. Comunicación en Tiempo Real mediante Server-Sent Events (SSE)

Para mantener la pantalla de cocina sincronizada en tiempo real sin recargar la página, se utiliza la ruta `GET /api/pedidos/stream`.

### Eventos Emitidos por el Servidor:

| Evento | Cuándo se dispara | Payload (`data`) |
| :--- | :--- | :--- |
| `nuevo_pedido` | Cuando n8n notifica al servidor de cocina sobre una nueva orden completada en WhatsApp. | El objeto `Pedido` completo. |
| `pedido_actualizado` | Cuando se cambia el estado del pedido (ej. de pendiente a preparación) o se crea un pedido de prueba. | El objeto `Pedido` modificado. |
| `pedido_eliminado` | Cuando se borra un pedido del panel administrativo de cocina. | El `id` (UUID) del pedido eliminado. |

### ⚠️ ERROR DETECTADO EN EL FRONT-END ACTUAL (Importante de solucionar)

Al revisar el archivo del front-end `front/restaurant_bot_frontend/src/services/api.ts#L47-L62`, observamos el siguiente código:

```typescript
  listenToUpdates(
    onUpdate: (pedido: Pedido) => void, 
    onDelete: (id: string) => void
  ) {
    const evtSource = new EventSource(`${API_URL}/stream`);
    
    evtSource.addEventListener('pedido_actualizado', (e) => {
      onUpdate(JSON.parse(e.data));
    });

    evtSource.addEventListener('pedido_eliminado', (e) => {
      onDelete(JSON.parse(e.data));
    });

    return () => evtSource.close();
  }
```

#### El Problema:
El front-end **no escucha** el evento `'nuevo_pedido'`. Esto significa que cuando un cliente realiza una compra por WhatsApp y n8n la registra de forma exitosa, la pantalla de cocina **no mostrará la tarjeta de forma automática**, a menos que el usuario recargue manualmente la pantalla o se fuerce un refresco.

#### La Solución:
El agente de front-end debe registrar un listener adicional para `'nuevo_pedido'`, vinculándolo al mismo callback de inserción (`onUpdate` o una función de inserción nueva):

```typescript
    evtSource.addEventListener('nuevo_pedido', (e) => {
      onUpdate(JSON.parse(e.data));
    });
```

---

## 5. Resumen de Reglas y Directrices para el Agente del Front-End

Cuando construyas, depures o extiendas la interfaz del front-end, ten en cuenta:

1. **Host y URLs de Conexión:**
   * Las llamadas de gestión de cocina deben ir al puerto `3001` (`/api/pedidos`, `/api/menu`, etc.).
   * Si desarrollas simuladores de chat o buscas historiales de conversación, las llamadas deben ir al puerto `3002` (`/api/webhooks/...`).
2. **Validación de Respuestas:**
   * Todas las respuestas HTTP del backend envuelven sus datos con la propiedad `{ ok: true, data: ... }` o `{ ok: true, categorias: ... }`. En caso de fallo, retornan `{ ok: false, error: 'MOTIVO_ERROR', message: 'Detalle del error' }`. Comprueba siempre la propiedad `ok` antes de procesar.
3. **Flujo de Estados:**
   * Sigue la secuencia de estados en orden lógico: `pendiente` ➡️ `confirmado` (si aplica) ➡️ `en_preparacion` ➡️ `entregado`.
   * Los botones de acción deben deshabilitarse o cambiar de forma dinámica según el estado del pedido actual (ej. no permitir "Comenzar a preparar" si ya está "entregado").
4. **Modificación de disponibilidad:**
   * Recuerda que el endpoint `PATCH /api/productos/:id/disponibilidad` actúa como un interruptor ("toggle"). Al llamarlo, el estado actual de `activo` en base de datos cambiará a su opuesto.
5. **IDs e Identificadores:**
   * Todos los IDs de pedidos, productos, clientes y sucursales son UUIDs válidos. Al simular o probar endpoints en desarrollo, asegúrate de recuperar un ID existente en la base de datos PostgreSQL.
