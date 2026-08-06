# Especificación de Comunicación Front-End (Guía MCP del Front-End)

Este documento sirve como especificación y mapa de contexto (Model Context Protocol / Context Guide) para comprender y extender la interfaz del Front-End del sistema de pantalla de cocina y gestión de reservas del restaurante **Santo Bocado**.

---

## 1. Arquitectura y Stack Tecnológico

El front-end está diseñado para funcionar en tabletas o pantallas táctiles de cocina y administración del restaurante.

* **Framework:** React 19 (montado con Vite y TypeScript)
* **Estilos:** Tailwind CSS v4 con utilidades de `clsx` y `tailwind-merge` para control de clases dinámicas (siguiendo las directrices de diseño de Shadcn UI).
* **Gestor de Paquetes:** pnpm / npm
* **Estructura Principal:**
  * [src/App.tsx](file:///C:/Users/isaac/Documents/santoBocado/front/restaurant_bot_frontend/src/App.tsx): Dashboard de cocina principal. Renderiza tarjetas de pedidos activos, gestiona el estado global de pedidos y configura la comunicación SSE.
  * [src/services/api.ts](file:///C:/Users/isaac/Documents/santoBocado/front/restaurant_bot_frontend/src/services/api.ts): Capa de red que maneja peticiones HTTP y suscripción a eventos Server-Sent Events (SSE).
  * `src/components/ui/`: Componentes modulares y reutilizables:
    * `card.tsx` / `button.tsx`: Bloques básicos de interfaz.
    * `clock.tsx`: Reloj de pared en cabecera de cocina.
    * `animated-status-badge.tsx`: Animación flash en cambio de estado de tarjetas.
    * [reservas-panel.tsx](file:///C:/Users/isaac/Documents/santoBocado/front/restaurant_bot_frontend/src/components/ui/reservas-panel.tsx): Cajón lateral (drawer) animado con Framer Motion para gestión de reservas del día.

---

## 2. Modelos de Datos en el Cliente (TypeScript Interfaces)

Definidos en `api.ts`, estructuran los datos recibidos del back-end:

### 📋 Pedido (`Pedido`)
```typescript
export interface Pedido {
  id: string; // UUID
  estado: string; // 'pendiente' | 'confirmado' | 'en_preparacion' | 'entregado' | 'cancelado'
  tipo: string; // 'delivery' | 'recoger'
  numero_pedido: number; // Correlativo diario
  subtotal: string;
  total: string;
  metodo_pago: string;
  created_at: string; // ISO Timestamp
  cliente_telefono: string | null;
  cliente_nombre: string | null;
  productos: Producto[];
  updated_at?: string; // Metadata del stream SSE
}
```

### 🍔 Producto del Pedido (`Producto`)
```typescript
export interface Producto {
  producto_id: string;
  nombre: string;
  cantidad: number;
  notas: string | null; // Notas especiales, ej: "Sin cebolla"
  extras?: string[]; // Modificadores cobrados, ej: ["Extra Queso"]
  precio_unitario: string;
  subtotal: string;
}
```

### 📅 Reserva (`Reserva`)
```typescript
export interface Reserva {
  id: string;
  cliente_nombre: string;
  cliente_telefono: string;
  fecha: string;
  hora: string; // Formato local HH:MM
  num_personas: number;
  estado: string;
  notas: string | null;
}
```

---

## 3. Integración de Red y Sincronización en Tiempo Real

El Front-End interactúa con los dos puertos del Back-End (Cocina: 3001 y Webhooks: 3002).

### 📡 Comunicación HTTP (Peticiones REST)
* **Listado de Cocina:** `GET /api/pedidos` en puerto `3001` carga los pedidos activos.
* **Transiciones de Cocina:** `PATCH /api/pedidos/:id` en puerto `3001` para mutar estados de preparación.
* **Filtro de Reservas:** `GET /api/reservas?fecha={HOY}&estado=pendiente` en puerto `3001` para reservas pendientes.
* **Aprobación de Reserva:** `PATCH /api/webhooks/reservas/:id` en puerto `3002` (Servidor de N8N/Webhooks) para confirmar/cancelar reservas gestionadas por el bot.

### ⚡ Server-Sent Events (Sincronización en tiempo real)
Se suscribe a `GET /api/pedidos/stream` (puerto 3001) para recibir eventos push. 

#### Eventos Implementados:
1. **`nuevo_pedido`:** Cuando el bot procesa un pedido de un cliente por WhatsApp. La UI inserta el pedido de forma inmediata al inicio de la lista de React:
   ```typescript
   setPedidos(prev => [pedidoActualizado, ...prev])
   ```
2. **`pedido_actualizado`:** Cuando cambia de estado (`pendiente` ➡️ `en_preparacion` ➡️ `entregado`) o se editan sus items. Actualiza la tarjeta correspondiente en caliente.
3. **`pedido_eliminado`:** Remueve la tarjeta de la vista cuando se borra un pedido del servidor.

### 📅 Control de Reservas (Polling)
El panel de reservas ([reservas-panel.tsx](file:///C:/Users/isaac/Documents/santoBocado/front/restaurant_bot_frontend/src/components/ui/reservas-panel.tsx)) ejecuta una recarga automática de reservas pendientes cada **30 segundos** vía `setInterval`. Cuenta con un botón de refresco manual para el operador.

---

## 4. Hallazgos y Directrices Críticas de Desarrollo

1. **Evitar Hardcodeo de Host (localhost):**
   * *Problema:* Las constantes `API_URL` y `RESERVAS_API_URL` en `api.ts` tienen hardcodeado `http://localhost:3001` y `http://localhost:3002`.
   * *Directriz:* Al pasar a producción o entornos Dockerizados controlados por un proxy reverso (Traefik/Nginx), estas variables deben configurarse dinámicamente mediante variables de entorno de Vite (`import.meta.env.VITE_API_URL`) o resolverse de forma relativa (`/api/pedidos`).
2. **Mapeo de Nombres de Clientes en Reservas:**
   * En el controlador del backend, el cliente de la reserva tiene propiedades separadas `nombre` y `apellidos`. El front-end unifica ambos campos concatenándolos para presentarlos en las tarjetas de reserva:
     ```typescript
     const cliente_nombre = r.cliente 
       ? `${r.cliente.nombre} ${r.cliente.apellidos || ''}`.trim() 
       : 'Cliente';
     ```
3. **Resiliencia en Conexiones SSE:**
   * Las cocinas suelen sufrir inestabilidad de red inalámbrica. Se recomienda implementar una envoltura alrededor de `EventSource` que gestione la reconexión exponencial y visualice avisos de desconexión en cabecera en caso de caída del servidor.
4. **Retroalimentación de Acción (Animaciones):**
   * Al cambiar el estado de un pedido, se activa la propiedad `trigger` de `AnimatedStatusBadge` para dar feedback visual al chef de que el pedido ha pasado a la siguiente etapa de preparación.
