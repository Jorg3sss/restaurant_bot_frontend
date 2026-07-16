import { useEffect, useState } from 'react'
import { Clock as ClockIcon, Calendar as CalendarIcon } from 'lucide-react'

export function Clock() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit', 
      hour12: true 
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    })
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-3 bg-white/80 backdrop-blur-md px-4 py-2.5 rounded-full border border-gray-200/50 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl hover:bg-white select-none">
      {/* Indicador pulsante en tiempo real */}
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </span>
      
      {/* Icono de Calendario y Fecha */}
      <div className="flex items-center space-x-1.5 text-xs text-gray-500 font-medium border-r border-gray-200 pr-3">
        <CalendarIcon className="h-3.5 w-3.5 text-gray-400" />
        <span className="capitalize">{formatDate(time)}</span>
      </div>

      {/* Icono de Reloj y Hora */}
      <div className="flex items-center space-x-1.5 text-sm font-bold text-gray-800 tabular-nums">
        <ClockIcon className="h-4 w-4 text-emerald-500" />
        <span>{formatTime(time)}</span>
      </div>
    </div>
  )
}
