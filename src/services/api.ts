import axios from 'axios';

export const api = axios.create({
  baseURL: '/api' // This goes to the vite proxy or directly
});

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
    const response = await api.get('/pedidos');
    return response.data.data;
  },

  async updateEstado(id: string, nuevoEstado: string): Promise<void> {
    await api.patch(`/pedidos/${id}`, { estado: nuevoEstado });
  },

  // SSE Listener setup
  listenToUpdates(
    onUpdate: (pedido: Pedido) => void, 
    onDelete: (id: string) => void
  ) {
    // Pasar el token por query param para SSE porque EventSource no soporta headers
    const token = localStorage.getItem('santo_bocado_token');
    const evtSource = new EventSource(`/api/pedidos/stream${token ? '?token=' + token : ''}`);
    
    const handleUpdate = (e: MessageEvent) => {
      try {
        const rawData = JSON.parse(e.data);
        if (!rawData || !rawData.id) return;
        
        // Normalizar productos por si vienen en formato raw de Prisma (pedido_detalle)
        let productos = Array.isArray(rawData.productos) ? rawData.productos : [];
        if (productos.length === 0 && Array.isArray(rawData.pedido_detalle)) {
          productos = rawData.pedido_detalle.map((pd: any) => ({
            producto_id: pd.producto_id,
            nombre: pd.producto?.nombre || 'Producto',
            cantidad: pd.cantidad || 1,
            notas: pd.notas || null,
            precio_unitario: pd.precio_unitario || '0',
            subtotal: pd.subtotal || '0',
            extras: Array.isArray(pd.pedido_detalle_modificador) 
              ? pd.pedido_detalle_modificador.map((m: any) => m.nombre_historico) 
              : []
          }));
        }

        const pedido: Pedido = {
          ...rawData,
          cliente_nombre: rawData.cliente_nombre || rawData.cliente?.nombre || null,
          cliente_telefono: rawData.cliente_telefono || rawData.cliente?.telefono || null,
          productos
        };

        onUpdate(pedido);
      } catch (err) {
        console.error('Error al procesar actualización SSE de pedido:', err);
      }
    };

    evtSource.addEventListener('nuevo_pedido', handleUpdate);
    evtSource.addEventListener('pedido_actualizado', handleUpdate);

    evtSource.addEventListener('pedido_eliminado', (e) => {
      try {
        const data = JSON.parse(e.data);
        const id = typeof data === 'string' ? data : data?.id;
        if (id) onDelete(id);
      } catch (err) {
        console.error('Error al procesar eliminación SSE:', err);
      }
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
    const hoy = new Date().toISOString().split('T')[0];
    const response = await fetch(`${RESERVAS_API_URL}?fecha=${hoy}&estado=pendiente`);
    const json = await response.json();
    if (!json.ok) throw new Error(json.error || "Error al obtener las reservas");
    
    if (Array.isArray(json.reservas)) {
      return json.reservas.map((r: any) => {
        const cliente_nombre = r.cliente 
          ? `${r.cliente.nombre} ${r.cliente.apellidos || ''}`.trim() 
          : 'Cliente';
        const cliente_telefono = r.cliente?.telefono || '';
        
        let hora = r.hora || '';
        if (hora.includes('T')) {
          hora = hora.split('T')[1].substring(0, 5);
        }
        
        return {
          id: r.id,
          cliente_nombre,
          cliente_telefono,
          fecha: r.fecha,
          hora,
          num_personas: r.num_personas,
          estado: r.estado,
          notas: r.notas
        };
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
