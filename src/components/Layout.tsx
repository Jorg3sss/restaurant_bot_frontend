import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { LogOut, ClipboardList, Utensils, CalendarDays } from 'lucide-react';

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItemClass = ({ isActive }: { isActive: boolean }) => 
    `flex items-center space-x-2 px-4 py-3 rounded-lg font-semibold transition-colors duration-200 ${
      isActive 
      ? 'bg-blue-50 text-blue-700' 
      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-200 shadow-sm flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Santo Bocado</h1>
          <p className="text-xs text-gray-500 font-medium mt-1">Panel de Control</p>
        </div>
        
        <div className="p-4 flex flex-col space-y-2 flex-grow">
          {/* Opciones disponibles para TODOS */}
          <NavLink to="/pedidos" className={navItemClass}>
            <ClipboardList className="w-5 h-5" />
            <span>Pedidos</span>
          </NavLink>

          {/* Opciones disponibles SOLO para Admin / Encargado */}
          {user?.rol !== 'Cocina' && (
            <>
              <NavLink to="/productos" className={navItemClass}>
                <Utensils className="w-5 h-5" />
                <span>Productos (Menú)</span>
              </NavLink>
              <NavLink to="/reservas" className={navItemClass}>
                <CalendarDays className="w-5 h-5" />
                <span>Reservas</span>
              </NavLink>
            </>
          )}
        </div>

        <div className="p-4 border-t border-gray-100">
          <div className="mb-4 px-2">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Usuario activo</p>
            <p className="text-sm font-bold text-gray-800">{user?.nombre}</p>
            <span className="inline-block mt-1 bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wide">
              {user?.rol}
            </span>
          </div>
          <Button onClick={handleLogout} variant="outline" className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200">
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </aside>

      {/* Contenido Principal */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
