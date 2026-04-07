'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signUp } from '@/lib/actions/auth';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function SignupPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = e.currentTarget;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    const confirm  = (form.elements.namedItem('confirm') as HTMLInputElement).value;

    if (password !== confirm) {
      setError('As senhas não coincidem.');
      setLoading(false);
      return;
    }

    const result = await signUp({
      email:    (form.elements.namedItem('email') as HTMLInputElement).value,
      password,
      fullName: (form.elements.namedItem('fullName') as HTMLInputElement).value,
    });

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  const inputCls = `w-full px-3.5 py-2.5 bg-white/10 border border-white/20 rounded-lg
    text-white placeholder:text-slate-500 text-sm
    focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-colors`;
  const labelCls = 'block text-sm font-medium text-slate-300 mb-1.5';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-orange-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm relative">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-orange-600 shadow-lg shadow-orange-900/50 mb-4">
            <span className="text-white font-bold text-xl">R</span>
          </div>
          <h1 className="text-2xl font-bold text-white">RHINO Machines</h1>
          <p className="text-slate-400 text-sm mt-1">Crie sua conta</p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl p-8">
          <h2 className="text-lg font-semibold text-white mb-6">Novo cadastro</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={labelCls}>Nome completo</label>
              <input name="fullName" type="text" required placeholder="João Silva" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>E-mail</label>
              <input name="email" type="email" required placeholder="seu@email.com" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Senha</label>
              <input name="password" type="password" required placeholder="Mínimo 6 caracteres" minLength={6} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Confirmar senha</label>
              <input name="confirm" type="password" required placeholder="Repita a senha" className={inputCls} />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4
                         bg-orange-600 hover:bg-orange-700 text-white font-medium text-sm rounded-lg
                         disabled:opacity-60 disabled:cursor-not-allowed transition-colors mt-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-6">
            Já tem conta?{' '}
            <Link href="/auth/login" className="text-orange-400 hover:text-orange-300 font-medium transition-colors">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
