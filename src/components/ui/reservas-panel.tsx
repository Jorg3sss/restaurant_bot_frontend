import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar as CalendarIcon, 
  Clock as ClockIcon, 
  Users as UsersIcon, 
  MessageSquare as MessageIcon, 
  X as XIcon, 
  Check as CheckIcon, 
  Phone as PhoneIcon, 
  RefreshCw as RefreshIcon,
  Trash2 as TrashIcon
} from 'lucide-react'
import { reservasService, type Reserva } from '../../services/api'

export function ReservasPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [loading, setLoading] = useState(false)

  // Cargar reservas al inicio
  const cargarReservas = async () => {
    setLoading(true)
    try {
      const data = await reservasService.getReservasHoy()
      // Filtramos solo las pendientes
      setReservas(data.filter(r => r.estado === 'pendiente'))
    } catch (e) {
      console.error("Error al cargar reservas:", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarReservas()
    // Poll cada 30 segundos para nuevas reservas
    const interval = setInterval(cargarReservas, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleConfirmarReserva = async (id: string) => {
    try {
      await reservasService.updateEstado(id, 'confirmada')
      // Actualizamos localmente quitándola de la lista de pendientes
      setReservas(prev => prev.filter(r => r.id !== id))
    } catch (error) {
      console.error("Error al confirmar reserva:", error)
    }
  }

  const handleCancelarReserva = async (id: string) => {
    try {
      await reservasService.updateEstado(id, 'cancelada')
      // Actualizamos localmente quitándola de la lista de pendientes
      setReservas(prev => prev.filter(r => r.id !== id))
    } catch (error) {
      console.error("Error al cancelar reserva:", error)
    }
  }

  return (
    <>
      {/* Pestaña flotante a la izquierda (Estado Colapsado) */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed left-0 top-1/2 -translate-y-1/2 z-40 flex items-center bg-amber-500 hover:bg-amber-600 text-white font-bold py-6 px-3.5 rounded-r-2xl shadow-xl border-y border-r border-amber-400/50 cursor-pointer select-none transition-all duration-300 hover:pl-5 group"
          >
            <div 
              className="flex items-center space-x-2"
              style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
            >
              <div className="flex items-center gap-2 rotate-180">
                <CalendarIcon className="h-4 w-4 shrink-0 text-amber-100 group-hover:scale-110 transition-transform" />
                <span className="tracking-wide">
                  Reservas pendientes en el día {reservas.length}
                </span>
              </div>
            </div>
            {reservas.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[10px] items-center justify-center text-white font-black">
                  {reservas.length}
                </span>
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drawer / Panel Expandible (Framer Motion) */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop oscuro */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40"
            />

            {/* Contenedor del panel lateral */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed left-0 top-0 bottom-0 h-full w-full max-w-md bg-gray-50 border-r border-gray-200 shadow-2xl z-50 flex flex-col"
            >
              {/* Header del Panel */}
              <div className="p-6 bg-white border-b border-gray-200 flex justify-between items-center shadow-xs">
                <div>
                  <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-amber-500" />
                    Reservas del Día
                  </h2>
                  <p className="text-xs text-gray-500 font-medium">
                    Hoy hay {reservas.length} reservas pendientes
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={cargarReservas}
                    disabled={loading}
                    className="p-2 hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-50"
                    title="Actualizar reservas"
                  >
                    <RefreshIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    <XIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Contenido / Listado */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {loading && reservas.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 space-y-3">
                    <RefreshIcon className="h-8 w-8 text-amber-500 animate-spin" />
                    <p className="text-sm font-medium text-gray-500">Cargando reservas...</p>
                  </div>
                ) : reservas.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
                    <div className="bg-amber-50 p-4 rounded-full border border-amber-100">
                      <CalendarIcon className="h-8 w-8 text-amber-400" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-700">Sin reservas pendientes</p>
                      <p className="text-xs text-gray-500 max-w-xs mt-1">
                        No hay reservas programadas para hoy o ya han sido gestionadas.
                      </p>
                    </div>
                  </div>
                ) : (
                  reservas.map((reserva) => (
                    <motion.div
                      key={reserva.id}
                      layout
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden"
                    >
                      {/* Estado */}
                      <div className="absolute top-4 right-4 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {reserva.estado}
                      </div>

                      {/* Info principal */}
                      <div className="space-y-3">
                        {/* Nombre y Avatar */}
                        <div className="flex items-center space-x-3">
                          <div className="h-9 w-9 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-sm shadow-inner uppercase">
                            {reserva.cliente_nombre.substring(0, 2)}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 text-base leading-tight">
                              {reserva.cliente_nombre}
                            </h3>
                            <a 
                              href={`tel:${reserva.cliente_telefono}`}
                              className="text-xs text-gray-400 hover:text-amber-600 flex items-center gap-1 font-mono mt-0.5"
                            >
                              <PhoneIcon className="h-3 w-3" />
                              {reserva.cliente_telefono}
                            </a>
                          </div>
                        </div>

                        {/* Detalles */}
                        <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-gray-100 text-sm text-gray-600">
                          <div className="flex items-center gap-1.5">
                            <ClockIcon className="h-4 w-4 text-amber-500 shrink-0" />
                            <span className="font-bold font-mono">
                              {reserva.hora.substring(0, 5)} hrs
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <UsersIcon className="h-4 w-4 text-amber-500 shrink-0" />
                            <span className="font-medium">
                              <strong className="text-gray-950 font-bold">{reserva.num_personas}</strong> personas
                            </span>
                          </div>
                        </div>

                        {/* Notas */}
                        {reserva.notas && (
                          <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-xs text-gray-500 flex items-start gap-1.5">
                            <MessageIcon className="h-3.5 w-3.5 text-gray-400 shrink-0 mt-0.5" />
                            <div>
                              <strong className="uppercase font-black text-[9px] text-gray-400 block mb-0.5">Nota:</strong>
                              <span className="italic">"{reserva.notas}"</span>
                            </div>
                          </div>
                        )}

                        {/* Acciones */}
                        <div className="flex items-center gap-2.5 pt-3 border-t border-gray-100">
                          <button
                            onClick={() => handleConfirmarReserva(reserva.id)}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1 shadow-sm transition-colors cursor-pointer"
                          >
                            <CheckIcon className="h-3.5 w-3.5" />
                            Confirmar
                          </button>
                          <button
                            onClick={() => handleCancelarReserva(reserva.id)}
                            className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 font-bold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          >
                            <TrashIcon className="h-3.5 w-3.5" />
                            Cancelar
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
