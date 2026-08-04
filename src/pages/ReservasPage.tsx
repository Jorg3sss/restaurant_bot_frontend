import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Loader2, CalendarDays, Users, MapPin, Clock } from 'lucide-react';

interface Reserva {
  id: string;
  fecha: string;
  hora: string;
  num_personas: number;
  estado: string;
  notas: string | null;
  created_at: string;
  cliente: {
    id: string;
    nombre: string | null;
    apellidos: string | null;
    telefono: string;
  } | null;
  mesa: {
    id: string;
    numero: number;
    ubicacion: string | null;
  } | null;
}

const estadoColors: Record<string, string> = {
  pendiente: 'bg-yellow-100 text-yellow-800',
  confirmada: 'bg-green-100 text-green-800',
  cancelada: 'bg-red-100 text-red-800',
  completada: 'bg-blue-100 text-blue-800',
};

const estadoOptions = ['pendiente', 'confirmada', 'cancelada', 'completada'];

export function ReservasPage() {
  const { user } = useAuth();
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filtroFecha, setFiltroFecha] = useState(() => {
    const hoy = new Date();
    return hoy.toISOString().split('T')[0];
  });
  const [filtroEstado, setFiltroEstado] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchReservas = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const params: Record<string, string> = {
        restaurante_id: user.restaurante_id,
      };
      if (filtroFecha) params.fecha = filtroFecha;
      if (filtroEstado) params.estado = filtroEstado;

      const res = await api.get('/reservas', { params });
      setReservas(res.data.reservas || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('Error al cargar reservas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservas();
  }, [user, filtroFecha, filtroEstado]);

  const handleCambiarEstado = async (id: string, nuevoEstado: string) => {
    setUpdatingId(id);
    try {
      await api.patch(`/reservas/${id}`, { estado: nuevoEstado });
      setReservas((prev) =>
        prev.map((r) => (r.id === id ? { ...r, estado: nuevoEstado } : r))
      );
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error al actualizar';
      alert(msg);
    } finally {
      setUpdatingId(null);
    }
  };

  const formatFecha = (fecha: string) => {
    try {
      const d = new Date(fecha);
      return d.toLocaleDateString('es-MX', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return fecha;
    }
  };

  const formatHora = (hora: string) => {
    try {
      // hora viene como "1970-01-01T20:00:00.000Z" o "20:00:00"
      if (hora.includes('T')) {
        return hora.split('T')[1].substring(0, 5);
      }
      return hora.substring(0, 5);
    } catch {
      return hora;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Reservaciones</h1>
          <p className="text-sm text-gray-500 mt-1">
            {total} reserva{total !== 1 ? 's' : ''} encontrada{total !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={fetchReservas} variant="outline" className="w-fit">
          Recargar
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-gray-400" />
          <input
            type="date"
            value={filtroFecha}
            onChange={(e) => setFiltroFecha(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white shadow-sm"
          />
          {filtroFecha && (
            <button
              onClick={() => setFiltroFecha('')}
              className="text-xs text-blue-600 hover:underline"
            >
              Ver todas
            </button>
          )}
        </div>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white shadow-sm"
        >
          <option value="">Todos los estados</option>
          {estadoOptions.map((e) => (
            <option key={e} value={e}>
              {e.charAt(0).toUpperCase() + e.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin h-8 w-8 text-gray-400" />
        </div>
      ) : reservas.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            No hay reservaciones{filtroFecha ? ` para el ${formatFecha(filtroFecha)}` : ''}.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {reservas.map((r) => (
            <Card
              key={r.id}
              className={`overflow-hidden border-l-4 ${
                r.estado === 'confirmada'
                  ? 'border-l-green-500'
                  : r.estado === 'cancelada'
                  ? 'border-l-red-400'
                  : r.estado === 'completada'
                  ? 'border-l-blue-400'
                  : 'border-l-yellow-400'
              }`}
            >
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  {/* Info principal */}
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-gray-900">
                        {r.cliente
                          ? `${r.cliente.nombre || 'Sin nombre'}${r.cliente.apellidos ? ' ' + r.cliente.apellidos : ''}`
                          : 'Cliente desconocido'}
                      </h3>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${
                          estadoColors[r.estado] || 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {r.estado}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {formatFecha(r.fecha)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatHora(r.hora)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {r.num_personas} persona{r.num_personas !== 1 ? 's' : ''}
                      </span>
                      {r.mesa && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          Mesa {r.mesa.numero}
                          {r.mesa.ubicacion ? ` (${r.mesa.ubicacion})` : ''}
                        </span>
                      )}
                    </div>

                    {r.cliente?.telefono && (
                      <p className="text-xs text-gray-400">Tel: {r.cliente.telefono}</p>
                    )}
                    {r.notas && (
                      <p className="text-xs text-gray-500 italic">📝 {r.notas}</p>
                    )}
                  </div>

                  {/* Acciones de estado */}
                  <div className="flex flex-wrap gap-2 sm:flex-col">
                    {estadoOptions
                      .filter((e) => e !== r.estado)
                      .map((e) => (
                        <Button
                          key={e}
                          variant="outline"
                          size="sm"
                          disabled={updatingId === r.id}
                          onClick={() => handleCambiarEstado(r.id, e)}
                          className={`text-xs capitalize ${
                            e === 'confirmada'
                              ? 'border-green-300 text-green-700 hover:bg-green-50'
                              : e === 'cancelada'
                              ? 'border-red-300 text-red-700 hover:bg-red-50'
                              : e === 'completada'
                              ? 'border-blue-300 text-blue-700 hover:bg-blue-50'
                              : 'border-yellow-300 text-yellow-700 hover:bg-yellow-50'
                          }`}
                        >
                          {updatingId === r.id ? (
                            <Loader2 className="animate-spin h-3 w-3" />
                          ) : (
                            `Marcar ${e}`
                          )}
                        </Button>
                      ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default ReservasPage;
