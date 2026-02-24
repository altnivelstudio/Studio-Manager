import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { LogIn, User, Lock, Loader2 } from 'lucide-react';
import { Freelancer } from './types';

interface AuthProps {
  onLogin: (user: any) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [freelancerId, setFreelancerId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);

  useEffect(() => {
    const fetchFreelancers = async () => {
      const { data } = await supabase.from('freelancers').select('*');
      if (data) setFreelancers(data);
    };
    fetchFreelancers();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: dbError } = await supabase
        .from('app_users')
        .select('*, freelancers(name)')
        .eq('freelancer_id', freelancerId)
        .eq('password', password)
        .maybeSingle();

      if (dbError) throw dbError;

      if (data) {
        onLogin(data);
      } else {
        setError('ID sau Parolă incorectă.');
      }
    } catch (err: any) {
      setError('Eroare la conectare: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20">
            <LogIn className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white">Alt Nivel Studio</h1>
          <p className="text-zinc-500 text-sm">Autentificare Manager Financiar</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-zinc-500 ml-1">Utilizator (Membru)</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <select
                  required
                  value={freelancerId}
                  onChange={(e) => setFreelancerId(e.target.value)}
                  className="w-full bg-zinc-800 border-none rounded-xl py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                >
                  <option value="">Selectează Membru</option>
                  {freelancers.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-zinc-500 ml-1">Parola</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-800 border-none rounded-xl py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-indigo-500 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs p-3 rounded-lg text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Intră în cont'}
            </button>
        </form>
      </div>
    </div>
  </div>
);
};
