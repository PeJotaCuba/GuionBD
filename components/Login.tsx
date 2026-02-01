import React, { useState, useRef } from 'react';
import { User } from '../types';
import { FileStack, Lock, User as UserIcon, AlertCircle, RefreshCw } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const adminUser: User = { 
      id: 'admin', 
      username: 'admin', 
      password: 'Guion26', 
      role: 'Administrador',
      fullName: 'Pedro José Reyes Acuña',
      mobile: '54413935',
      allowedPrograms: []
    };

    if ((identifier === adminUser.username || identifier === adminUser.mobile) && password === adminUser.password) {
      const savedUsers = JSON.parse(localStorage.getItem('guionbd_users') || '[]');
      const savedAdmin = savedUsers.find((u: User) => u.id === 'admin');
      onLogin(savedAdmin || adminUser);
      return;
    }

    const savedUsers = JSON.parse(localStorage.getItem('guionbd_users') || '[]');
    const found = savedUsers.find((u: User) => 
      (u.username === identifier || u.mobile === identifier) && u.password === password
    );
    
    if (found) {
      onLogin(found);
    } else {
      setError('Credenciales incorrectas. Verifica tu usuario/móvil y contraseña.');
    }
  };

  const handleUpdateUsers = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const uploaded = JSON.parse(text) as User[];
      if (Array.isArray(uploaded)) {
        localStorage.setItem('guionbd_users', JSON.stringify(uploaded));
        alert('Base de datos de usuarios actualizada correctamente.');
      } else {
        throw new Error();
      }
    } catch (err) {
      alert('Error: El archivo gusuario.json no tiene un formato válido.');
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
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  placeholder="admin o 54413935"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 pl-1">Contraseña</label>
              <div className="relative group">
                <Lock size={18} className="absolute left-3.5 top-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  placeholder="••••••••"
                />
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
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700"
              >
                <RefreshCw size={14} />
                Actualizar Usuarios (gusuario.json)
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleUpdateUsers} />
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-widest font-medium">GuionBD v2.3</p>
          </div>
        </div>
      </div>
    </div>
  );
};