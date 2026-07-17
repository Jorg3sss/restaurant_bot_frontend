const API_URL = 'http://localhost:3001/api/pedidos';

export interface Producto {
  producto_id: string;
  nombre: string;
  cantidad: number;
  notas: string | null;
  extras?: string[];
  precio_unitario: string;
  subtotal: string;
}

export interface Pedido {
  id: string;
  estado: string;
  tipo: string;
  numero_pedido: number;
  subtotal: string;
  total: string;
  metodo_pago: string;
  created_at: string;
  cliente_telefono: string | null;
  cliente_nombre: string | null;
  productos: Producto[];
  updated_at?: string; // from SSE
}

export const pedidosService = {
  async getAll(): Promise<Pedido[]> {
    const response = await fetch(API_URL);
    const json = await response.json();
    if (!json.ok) throw new Error(json.error);
    return json.data;
  },

  async updateEstado(id: string, nuevoEstado: string): Promise<void> {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: nuevoEstado })
    });
    const json = await response.json();
    if (!json.ok) throw new Error(json.error);
  },

  // SSE Listener setup
  listenToUpdates(
    onUpdate: (pedido: Pedido) => void, 
    onDelete: (id: string) => void
  ) {
    const evtSource = new EventSource(`${API_URL}/stream`);
    
    evtSource.addEventListener('nuevo_pedido', (e) => {
      onUpdate(JSON.parse(e.data));
    });

    evtSource.addEventListener('pedido_actualizado', (e) => {
      onUpdate(JSON.parse(e.data));
    });

    evtSource.addEventListener('pedido_eliminado', (e) => {
      onDelete(JSON.parse(e.data));
    });

    return () => evtSource.close();
  }
};

export interface Reserva {
  id: string;
  cliente_nombre: string;
  cliente_telefono: string;
  fecha: string;
  hora: string;
  num_personas: number;
  estado: string;
  notas: string | null;
}

const RESERVAS_API_URL = 'http://localhost:3001/api/reservas';

export const reservasService = {
  async getReservasHoy(): Promise<Reserva[]> {
    const response = await fetch(RESERVAS_API_URL);
    const json = await response.json();
    if (!json.ok) throw new Error(json.error || "Error al obtener las reservas");
    
    if (Array.isArray(json.data)) {
      const hoy = new Date().toISOString().split('T')[0];
      return json.data.filter((r: any) => {
        const fechaReserva = r.fecha.includes('T') ? r.fecha.split('T')[0] : r.fecha;
        return fechaReserva === hoy && r.estado === 'pendiente';
      });
    }
    return [];
  },

  async updateEstado(id: string, nuevoEstado: string): Promise<void> {
    const response = await fetch(`http://localhost:3002/api/webhooks/reservas/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: nuevoEstado })
    });
    const json = await response.json();
    if (!json.ok) throw new Error(json.error || "Error al actualizar estado de la reserva");
  }
};
