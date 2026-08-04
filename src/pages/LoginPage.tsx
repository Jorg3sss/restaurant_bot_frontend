import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Loader2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await api.post('/auth/login', { usuario, contrasena });
      if (response.data.ok) {
        login(response.data.token, response.data.usuario);
        navigate('/pedidos'); // Redirige al inicio (pedidos)
      }
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Error al conectar con el servidor');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md shadow-lg border-gray-200">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-3xl font-black text-gray-900">Santo Bocado</CardTitle>
          <p className="text-gray-500 text-sm mt-2">Inicia sesión en tu cuenta</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4 mt-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200 text-center font-medium">
                {error}
              </div>
            )}
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">Usuario</label>
              <input 
                type="text" 
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="ej. admin"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">Contraseña</label>
              <input 
                type="password" 
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="••••••••"
                required
              />
            </div>
            <Button type="submit" className="w-full bg-black text-white hover:bg-gray-800 font-bold" disabled={loading}>
              {loading ? <Loader2 className="animate-spin h-5 w-5 mx-auto" /> : 'Ingresar'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center pt-2 pb-6">
          <p className="text-xs text-gray-400">Panel de Administración Privado</p>
        </CardFooter>
      </Card>
    </div>
  );
};
