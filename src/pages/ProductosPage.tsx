import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Loader2, Search, ChevronDown, ChevronUp } from 'lucide-react';

interface ProductoItem {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: string;
  activo: boolean;
  categoria_nombre: string;
}

export function ProductosPage() {
  const { user } = useAuth();
  const [productos, setProductos] = useState<ProductoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const fetchProductos = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await api.get(`/productos/admin/${user.restaurante_id}`);
      // Prisma devuelve: { ok, categorias: [{ id, nombre, producto: [...] }] }
      const categorias = res.data.categorias || [];

      const flat: ProductoItem[] = [];
      const catNames = new Set<string>();
      categorias.forEach((cat: any) => {
        const catName = cat.nombre;
        catNames.add(catName);
        // Prisma usa "producto" (singular, nombre del modelo) no "productos"
        const prods = cat.producto || [];
        prods.forEach((p: any) => {
          flat.push({
            id: p.id,
            nombre: p.nombre,
            descripcion: p.descripcion,
            precio: p.precio,
            activo: p.activo ?? true,
            categoria_nombre: catName,
          });
        });
      });

      setProductos(flat);
      setExpandedCategories(catNames);
    } catch (err) {
      console.error('Error al cargar productos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductos();
  }, [user]);

  const handleToggle = async (id: string, currentActivo: boolean) => {
    setTogglingId(id);
    try {
      await api.patch(`/productos/${id}/disponibilidad`, { activo: !currentActivo });
      setProductos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, activo: !currentActivo } : p))
      );
    } catch (err) {
      console.error('Error al cambiar disponibilidad:', err);
    } finally {
      setTogglingId(null);
    }
  };

  const toggleCategory = (catName: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(catName)) next.delete(catName);
      else next.add(catName);
      return next;
    });
  };

  // Filtrado por búsqueda
  const filtered = useMemo(() => {
    if (!search.trim()) return productos;
    const q = search.toLowerCase();
    return productos.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        p.categoria_nombre.toLowerCase().includes(q) ||
        (p.descripcion && p.descripcion.toLowerCase().includes(q))
    );
  }, [productos, search]);

  // Agrupar por categoría
  const grouped = useMemo(() => {
    const map: Record<string, ProductoItem[]> = {};
    filtered.forEach((p) => {
      if (!map[p.categoria_nombre]) map[p.categoria_nombre] = [];
      map[p.categoria_nombre].push(p);
    });
    return map;
  }, [filtered]);

  const totalProductos = productos.length;
  const noDisponibles = productos.filter((p) => !p.activo).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin h-8 w-8 text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Productos del Menú</h1>
          <p className="text-sm text-gray-500 mt-1">
            {totalProductos} productos · {noDisponibles} no disponibles
          </p>
        </div>
        <Button onClick={fetchProductos} variant="outline" className="w-fit">
          Recargar
        </Button>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nombre, categoría o descripción..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm bg-white shadow-sm"
        />
      </div>

      {/* Tabla agrupada por categoría */}
      {Object.keys(grouped).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            No se encontraron productos{search ? ` para "${search}"` : ''}.
          </CardContent>
        </Card>
      ) : (
        Object.entries(grouped).map(([catName, items]) => (
          <Card key={catName} className="overflow-hidden">
            {/* Header de categoría (colapsable) */}
            <button
              onClick={() => toggleCategory(catName)}
              className="w-full flex items-center justify-between px-5 py-3 bg-gray-50 hover:bg-gray-100 transition-colors border-b border-gray-200"
            >
              <span className="font-bold text-gray-800 text-sm uppercase tracking-wide">
                {catName}
                <span className="ml-2 text-xs font-normal text-gray-500">
                  ({items.length} producto{items.length !== 1 ? 's' : ''})
                </span>
              </span>
              {expandedCategories.has(catName) ? (
                <ChevronUp className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              )}
            </button>

            {expandedCategories.has(catName) && (
              <div className="divide-y divide-gray-100">
                {/* Header de tabla */}
                <div className="grid grid-cols-12 px-5 py-2 bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <div className="col-span-5">Producto</div>
                  <div className="col-span-3">Descripción</div>
                  <div className="col-span-2 text-right">Precio</div>
                  <div className="col-span-2 text-center">Disponible</div>
                </div>

                {items.map((p) => (
                  <div
                    key={p.id}
                    className={`grid grid-cols-12 px-5 py-3 items-center transition-colors ${
                      !p.activo ? 'bg-red-50/40' : 'hover:bg-gray-50'
                    }`}
                  >
                    {/* Nombre */}
                    <div className="col-span-5">
                      <span className={`font-semibold text-sm ${!p.activo ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                        {p.nombre}
                      </span>
                    </div>

                    {/* Descripción */}
                    <div className="col-span-3">
                      <span className="text-xs text-gray-500 line-clamp-1">
                        {p.descripcion || '—'}
                      </span>
                    </div>

                    {/* Precio */}
                    <div className="col-span-2 text-right">
                      <span className="text-sm font-bold text-gray-800">
                        ${Number(p.precio).toFixed(2)}
                      </span>
                    </div>

                    {/* Switch de disponibilidad */}
                    <div className="col-span-2 flex justify-center">
                      <button
                        onClick={() => handleToggle(p.id, p.activo)}
                        disabled={togglingId === p.id}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                          p.activo ? 'bg-green-500' : 'bg-gray-300'
                        } ${togglingId === p.id ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
                            p.activo ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))
      )}
    </div>
  );
}

export default ProductosPage;
