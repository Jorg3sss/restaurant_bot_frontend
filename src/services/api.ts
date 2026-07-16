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

const MOCK_RESERVAS: Reserva[] = [
  {
    id: "r-001",
    cliente_nombre: "María Lopez",
    cliente_telefono: "9991234567",
    fecha: new Date().toISOString().split('T')[0],
    hora: "14:30:00",
    num_personas: 4,
    estado: "pendiente",
    notas: "Mesa cerca de la ventana"
  },
  {
    id: "r-002",
    cliente_nombre: "Carlos Perez",
    cliente_telefono: "9997654321",
    fecha: new Date().toISOString().split('T')[0],
    hora: "16:00:00",
    num_personas: 2,
    estado: "pendiente",
    notas: "Celebración de aniversario"
  },
  {
    id: "r-003",
    cliente_nombre: "Ana Gómez",
    cliente_telefono: "9998887776",
    fecha: new Date().toISOString().split('T')[0],
    hora: "19:00:00",
    num_personas: 6,
    estado: "pendiente",
    notas: "Requiere silla para bebé"
  }
];

export const reservasService = {
  async getReservasHoy(): Promise<Reserva[]> {
    try {
      const response = await fetch(RESERVAS_API_URL);
      if (!response.ok) throw new Error("Server error");
      const json = await response.json();
      if (json.ok && Array.isArray(json.data)) {
        const hoy = new Date().toISOString().split('T')[0];
        return json.data.filter((r: any) => r.fecha === hoy && r.estado === 'pendiente');
      }
      return MOCK_RESERVAS;
    } catch (e) {
      console.warn("No se pudo conectar al endpoint de reservas del backend, usando datos mock.", e);
      return MOCK_RESERVAS;
    }
  },

  async updateEstado(id: string, nuevoEstado: string): Promise<void> {
    try {
      const response = await fetch(`http://localhost:3002/api/webhooks/reservas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado })
      });
      const json = await response.json();
      if (!json.ok) throw new Error(json.error);
    } catch (e) {
      console.warn("No se pudo actualizar la reserva en el backend, simulando éxito local.", e);
    }
  }
};
