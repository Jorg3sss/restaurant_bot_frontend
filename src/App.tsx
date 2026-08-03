import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { PedidosPage } from './pages/PedidosPage';
import { ProductosPage } from './pages/ProductosPage';
import { ReservasPage } from './pages/ReservasPage';
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/pedidos" replace />} />
            <Route path="pedidos" element={<PedidosPage />} />
            
            {/* Rutas protegidas solo para Admin/Encargado */}
            <Route 
              path="productos" 
              element={
                <ProtectedRoute allowedRoles={['Administrador', 'Encargado']}>
                  <ProductosPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="reservas" 
              element={
                <ProtectedRoute allowedRoles={['Administrador', 'Encargado']}>
                  <ReservasPage />
                </ProtectedRoute>
              } 
            />
          </Route>
          
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
