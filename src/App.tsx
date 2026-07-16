import { useEffect, useState } from 'react'
import { pedidosService, type Pedido } from './services/api'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './components/ui/card'
import { Button } from './components/ui/button'
import { AnimatedStatusBadge } from './components/ui/animated-status-badge'
import { Loader2 } from 'lucide-react'
import { cn } from './lib/utils'

// Utilidad para color de estados
const getStatusColor = (estado: string) => {
  switch(estado) {
    case 'pendiente': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'confirmado': return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'en_preparacion': return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'entregado': return 'bg-green-100 text-green-800 border-green-200'
    case 'cancelado': return 'bg-red-100 text-red-800 border-red-200'
    default: return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

// Utilidad para nombre legible de estados
const getStatusName = (estado: string) => {
  switch(estado) {
    case 'pendiente': return 'Pendiente'
    case 'confirmado': return 'Confirmado'
    case 'en_preparacion': return 'En Preparación'
    case 'entregado': return 'Entregado'
    case 'cancelado': return 'Cancelado'
    default: return estado.toUpperCase()
  }
}

function App() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)
  // Estado para controlar qué tarjeta está animándose
  const [animatingCardId, setAnimatingCardId] = useState<string | null>(null)

  useEffect(() => {
    // 1. Cargar pedidos iniciales
    pedidosService.getAll()
      .then(data => {
        setPedidos(data)
        setLoading(false)
      })
      .catch(err => console.error("Error al cargar pedidos:", err))

    // 2. Conectar a SSE
    const cleanup = pedidosService.listenToUpdates(
      (pedidoActualizado) => {
        setPedidos(prev => {
          const index = prev.findIndex(p => p.id === pedidoActualizado.id)
          if (index !== -1) {
            const newPedidos = [...prev]
            newPedidos[index] = { ...newPedidos[index], ...pedidoActualizado }
            return newPedidos
          } else {
            // Si es un pedido nuevo, lo agregamos al inicio
            return [pedidoActualizado, ...prev]
          }
        })
      },
      (idEliminado) => {
        setPedidos(prev => prev.filter(p => p.id !== idEliminado))
      }
    )

    return cleanup
  }, [])

  const handleCambiarEstado = async (id: string, nuevoEstado: string) => {
    try {
      setAnimatingCardId(id) // Dispara la animación en la tarjeta específica
      await pedidosService.updateEstado(id, nuevoEstado)
    } catch (error) {
      console.error("Error al actualizar:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="animate-spin text-blue-600 h-10 w-10" />
          <p className="text-gray-500 font-medium">Cargando cocina...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex justify-between items-center mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Pantalla de Cocina</h1>
            <p className="text-gray-500 text-sm mt-1">Gestión de pedidos en tiempo real</p>
          </div>
        </header>

        {pedidos.length === 0 ? (
          <div className="text-center text-gray-500 mt-20 text-lg">No hay pedidos registrados hoy.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {pedidos.map((pedido) => (
              <div key={pedido.id} className="relative pt-3">
                {/* Badge Animado de estado que se sobrepone (z-20) */}
                <AnimatedStatusBadge 
                  trigger={animatingCardId === pedido.id} 
                  onAnimationComplete={() => setAnimatingCardId(null)}
                />

                <Card className="h-full flex flex-col relative z-10 overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 border-gray-200">
                  {/* Badge de estado estático siempre visible en la esquina superior izquierda */}
                  <div className={cn(
                    "absolute top-0 left-0 px-3 py-1 rounded-br-lg text-xs font-bold border-b border-r shadow-sm", 
                    getStatusColor(pedido.estado)
                  )}>
                    {getStatusName(pedido.estado)}
                  </div>

                  <CardHeader className="pb-3 pt-10 bg-white">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-2xl font-bold text-gray-800">
                        Pedido #{pedido.numero_pedido || pedido.id.split('-')[0]}
                      </CardTitle>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-gray-500">
                          {new Date(pedido.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                        <span className="text-xs font-bold bg-gray-800 text-white px-3 py-1 rounded-full shadow-sm">
                          {pedido.tipo === 'recoger' ? 'PICK UP' : 'DELIVERY'}
                        </span>
                      </div>
                    </div>
                    <div className="pt-2 text-sm text-gray-600 flex items-center space-x-2">
                      <span className="font-bold text-gray-900">Cliente: {pedido.cliente_nombre || 'Desconocido'}</span>
                      <span className="text-gray-300">•</span>
                      <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs">{pedido.cliente_telefono}</span>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="flex-grow space-y-3 bg-white">
                    <div className="bg-gray-50 rounded-lg p-5 border border-gray-100 shadow-inner">
                      <ul className="space-y-4">
                        {pedido.productos.map((prod, idx) => (
                          <li key={idx} className="flex justify-between text-sm">
                            <div className="flex space-x-3 w-full">
                              <span className="font-bold text-lg text-black h-min">{prod.cantidad}x</span>
                              <div className="flex flex-col flex-1">
                                <span className="font-bold text-gray-800 text-base">{prod.nombre}</span>
                                
                                {prod.extras && prod.extras.length > 0 && (
                                  <div className="mt-1 bg-red-50 border border-red-100 text-red-800 text-xs px-2 py-1 rounded-md font-medium">
                                    <span className="uppercase text-[10px] font-black mr-1 text-red-600">EXTRAS:</span>
                                    {prod.extras.join(', ')}
                                  </div>
                                )}

                                {prod.notas && (
                                  <div className="mt-1 bg-gray-50 border border-gray-200 text-gray-500 text-xs px-2 py-1 rounded-md font-medium">
                                    <span className="uppercase text-[10px] font-black mr-1 text-gray-400">NOTA:</span>
                                    {prod.notas}
                                  </div>
                                )}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>

                  <CardFooter className="bg-gray-50/80 border-t border-gray-200 p-5 flex flex-wrap gap-3 justify-end mt-auto">
                    {pedido.estado === 'pendiente' && (
                      <Button onClick={() => handleCambiarEstado(pedido.id, 'en_preparacion')} className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white shadow-md font-semibold">
                        Comenzar a Preparar
                      </Button>
                    )}
                    {pedido.estado === 'en_preparacion' && (
                      <Button onClick={() => handleCambiarEstado(pedido.id, 'entregado')} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-md font-semibold">
                        Marcar Listo / Entregado
                      </Button>
                    )}
                    {(pedido.estado === 'pendiente' || pedido.estado === 'en_preparacion') && (
                      <Button onClick={() => handleCambiarEstado(pedido.id, 'cancelado')} variant="destructive" className="w-full sm:w-auto shadow-sm font-semibold sm:ml-auto">
                        Cancelar Pedido
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default App
