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
    
    evtSource.addEventListener('pedido_actualizado', (e) => {
      onUpdate(JSON.parse(e.data));
    });

    evtSource.addEventListener('pedido_eliminado', (e) => {
      onDelete(JSON.parse(e.data));
    });

    return () => evtSource.close();
  }
};
