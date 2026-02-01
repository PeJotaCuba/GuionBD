import React, { useState, useEffect, useRef } from 'react';
import { User, UserRole } from '../types';
import { PROGRAMS } from './ProgramGrid';
import { 
  UserPlus, Trash2, ShieldCheck, UserCheck, 
  Search, Edit2, Download, Upload, FileText, X, Check, Globe
} from 'lucide-react';
import { parseUsersFromText } from '../services/parserService';

export const AdminSettings: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    mobile: '',
    password: '',
    role: 'Guionista' as UserRole,
    allowedPrograms: [] as string[]
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('guionbd_users');
    if (saved) setUsers(JSON.parse(saved));
  }, []);

  const saveUsers = (updated: User[]) => {
    setUsers(updated);
    localStorage.setItem('guionbd_users', JSON.stringify(updated));
  };

  const resetForm = () => {
    setFormData({ fullName: '', username: '', mobile: '', password: '', role: 'Guionista', allowedPrograms: [] });
    setEditingUser(null);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      fullName: user.fullName,
      username: user.username,
      mobile: user.mobile,
      password: user.password,
      role: user.role,
      allowedPrograms: user.allowedPrograms || []
    });
  };

  const toggleProgram = (programName: string) => {
    setFormData(prev => ({
      ...prev,
      allowedPrograms: prev.allowedPrograms.includes(programName)
        ? prev.allowedPrograms.filter(p => p !== programName)
        : [...prev.allowedPrograms, programName]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingUser) {
      const updated = users.map(u => u.id === editingUser.id ? { ...u, ...formData } : u);
      saveUsers(updated);
      alert('Usuario actualizado correctamente.');
    } else {
      if (users.some(u => u.username === formData.username || u.mobile === formData.mobile)) {
        alert('El nombre de usuario o número de móvil ya existe.');
        return;
      }
      const newUser: User = { id: crypto.randomUUID(), ...formData };
      saveUsers([...users, newUser]);
    }
    resetForm();
  };

  const removeUser = (id: string) => {
    if (id === 'admin') return;
    if (window.confirm('¿Eliminar este usuario?')) {
      saveUsers(users.filter(u => u.id !== id));
    }
  };

  const downloadUserDB = () => {
    const blob = new Blob([JSON.stringify(users, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = "gusuario.json";
    link.click();
  };

  const handleTxtUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const newUsers = parseUsersFromText(text);
    
    setUsers(prev => {
      const userMap = new Map(prev.map(u => [u.id, u]));
      newUsers.forEach(u => userMap.set(u.id, u));
      const merged = Array.from(userMap.values());
      localStorage.setItem('guionbd_users', JSON.stringify(merged));
      return merged;
    });
    alert('Usuarios cargados desde TXT exitosamente.');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Gestión de Usuarios</h2>
          <p className="text-slate-500 dark:text-slate-400">Administra acceso, roles y programas permitidos.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={downloadUserDB} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold shadow-sm hover:border-indigo-500 transition-all">
            <Download size={18} className="text-indigo-500" /> gusuario.json
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all">
            <FileText size={18} /> Cargar TXT
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept=".txt" onChange={handleTxtUpload} />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl space-y-5 sticky top-24">
            <h3 className="text-xl font-bold flex items-center gap-3 text-slate-800 dark:text-slate-100 mb-2">
              {editingUser ? <Edit2 size={24} className="text-amber-500" /> : <UserPlus size={24} className="text-indigo-500" />} 
              {editingUser ? 'Editar Perfil' : 'Nuevo Usuario'}
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Nombre Completo</label>
                <input type="text" required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Usuario</label>
                  <input type="text" required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Móvil</label>
                  <input type="text" required value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Contraseña</label>
                <input type="text" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Rol</label>
                <select disabled={editingUser?.id === 'admin'} value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as UserRole})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all">
                  <option value="Guionista">Guionista</option>
                  <option value="Asesor">Asesor</option>
                  <option value="Director">Director</option>
                  <option value="Administrador">Administrador</option>
                </select>
              </div>

              {formData.role === 'Guionista' && (
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Programas Permitidos</label>
                  <div className="max-h-40 overflow-y-auto bg-slate-50 dark:bg-slate-800 rounded-2xl p-3 border border-slate-100 dark:border-slate-700 space-y-1 no-scrollbar">
                    {PROGRAMS.map(prog => (
                      <label key={prog.name} className="flex items-center gap-2 p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl cursor-pointer text-xs font-bold">
                        <input 
                          type="checkbox" 
                          checked={formData.allowedPrograms.includes(prog.name)}
                          onChange={() => toggleProgram(prog.name)}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className={formData.allowedPrograms.includes(prog.name) ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}>
                          {prog.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button type="submit" className="flex-grow bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-2xl shadow-xl shadow-indigo-500/20 transition-all active:scale-95">
                {editingUser ? 'Guardar' : 'Registrar'}
              </button>
              {editingUser && (
                <button type="button" onClick={resetForm} className="p-3.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl"><X size={20} /></button>
              )}
            </div>
          </form>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Usuarios Registrados</h3>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map(user => (
                <div key={user.id} className="px-8 py-5 flex items-center justify-between group hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${['Administrador', 'Director', 'Asesor'].includes(user.role) ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>
                      {user.role === 'Administrador' ? <ShieldCheck size={24} /> : user.role === 'Director' ? <Globe size={24} /> : <UserCheck size={24} />}
                    </div>
                    <div>
                      <p className="font-black text-slate-900 dark:text-white leading-tight">{user.fullName}</p>
                      <div className="flex gap-2 text-[10px] text-slate-500 mt-0.5 font-bold uppercase tracking-tight">
                        <span className="text-indigo-500">@{user.username}</span>
                        <span>•</span>
                        <span>{user.role}</span>
                        {user.role === 'Guionista' && user.allowedPrograms && user.allowedPrograms.length > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-amber-500">{user.allowedPrograms.length} programas</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleEdit(user)} className="p-2.5 text-slate-400 hover:text-amber-500 rounded-xl transition-all"><Edit2 size={18} /></button>
                    {user.id !== 'admin' && (
                      <button onClick={() => removeUser(user.id)} className="p-2.5 text-slate-400 hover:text-red-500 rounded-xl transition-all"><Trash2 size={18} /></button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};