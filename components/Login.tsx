import React, { useState } from 'react';
import { User } from '../types';
import { FileStack, Lock, User as UserIcon, AlertCircle, RefreshCw, Eye, EyeOff } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const adminUser: User = { 
      id: 'admin', 
      username: 'admin', 
      password: 'RadioCiudad0026', 
      role: 'Administrador',
      fullName: 'Pedro José Reyes Acuña',
      mobile: '54413935',
      allowedPrograms: []
    };

    // Verificar credenciales del Admin (Usuario o Móvil)
    if ((identifier === adminUser.username || identifier === adminUser.mobile) && password === adminUser.password) {
      const savedUsers = JSON.parse(localStorage.getItem('guionbd_users') || '[]');
      const savedAdmin = savedUsers.find((u: User) => u.id === 'admin');
      // Priorizar datos guardados pero permitir acceso si la contraseña hardcoded coincide
      onLogin(savedAdmin || adminUser);
      return;
    }

    const savedUsers = JSON.parse(localStorage.getItem('guionbd_users') || '[]');
    // Verificar credenciales de usuarios registrados (Usuario o Móvil)
    const found = savedUsers.find((u: User) => 
      (u.username === identifier || u.mobile === identifier) && u.password === password
    );
    
    if (found) {
      onLogin(found);
    } else {
      setError('Credenciales incorrectas. Verifica tu usuario/móvil y contraseña.');
    }
  };

  const handleRemoteUpdate = async () => {
    setIsUpdating(true);
    try {
      const response = await fetch('https://raw.githubusercontent.com/PeJotaCuba/GuionBD/refs/heads/main/gusuario.json');
      if (!response.ok) throw new Error('Error de conexión con el servidor');
      
      const uploaded = await response.json();
      if (Array.isArray(uploaded)) {
        localStorage.setItem('guionbd_users', JSON.stringify(uploaded));
        alert('Base de datos de usuarios actualizada correctamente.');
      } else {
        throw new Error('Formato incorrecto');
      }
    } catch (err) {
      alert('Error al actualizar usuarios: ' + (err instanceof Error ? err.message : 'Desconocido'));
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 transition-colors duration-300">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-4 rounded-2xl shadow-xl shadow-indigo-500/20 mb-4">
              <FileStack className="text-white h-8 w-8" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Bienvenido</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Ingresa con tu Usuario o Móvil</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 pl-1">Usuario o Móvil</label>
              <div className="relative group">
                <UserIcon size={18} className="absolute left-3.5 top-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
                  placeholder=""
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 pl-1">Contraseña</label>
              <div className="relative group">
                <Lock size={18} className="absolute left-3.5 top-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
                  placeholder=""
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
            >
              Iniciar Sesión
            </button>
          </form>

          <div className="mt-6 flex flex-col items-center gap-4">
             <button 
                onClick={handleRemoteUpdate}
                disabled={isUpdating}
                className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw size={14} className={isUpdating ? "animate-spin" : ""} />
                Actualizar
              </button>
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-widest font-medium">GuionBD v2.3</p>
          </div>
        </div>
      </div>
    </div>
  );
};