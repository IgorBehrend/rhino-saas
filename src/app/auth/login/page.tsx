'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signIn } from '@/lib/actions/auth';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = e.currentTarget;
    const result = await signIn({
      email: (form.elements.namedItem('email') as HTMLInputElement).value,
      password: (form.elements.namedItem('password') as HTMLInputElement).value,
    });

    if (result?.error) {
      setError('E-mail ou senha inválidos.');
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #001e0e 0%, #003a1d 50%, #001e0e 100%)' }}
    >
      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(#008434 1px, transparent 1px), linear-gradient(90deg, #008434 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg"
            style={{ backgroundColor: '#008434' }}
          >
            <span className="text-white font-bold text-2xl">R</span>
          </div>
          <h1 className="text-2xl font-bold text-white">RHINO CNC</h1>
          <p className="text-sm mt-1" style={{ color: '#ffba00' }}>Gestão de Máquinas Industriais</p>
        </div>

        {/* Form card */}
        <div
          className="rounded-2xl shadow-2xl p-8"
          style={{ backgroundColor: 'rgba(0,58,29,0.6)', backdropFilter: 'blur(12px)', border: '1px solid #00562c' }}
        >
          <h2 className="text-lg font-semibold text-white mb-6">Entrar na plataforma</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#86efac' }}>
                E-mail
              </label>
              <input
                name="email"
                type="email"
                required
                placeholder="seu@email.com"
                className="w-full px-3.5 py-2.5 rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none transition-colors"
                style={{ backgroundColor: 'rgba(0,30,14,0.8)', border: '1px solid #00562c' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#86efac' }}>
                Senha
              </label>
              <input
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none transition-colors"
                style={{ backgroundColor: 'rgba(0,30,14,0.8)', border: '1px solid #00562c' }}
              />
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
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-white font-medium text-sm rounded-lg disabled:opacity-60 disabled:cursor-not-allowed transition-colors mt-2"
              style={{ backgroundColor: '#008434' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#00562c'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#008434'}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: '#86efac' }}>
            Não tem conta?{' '}
            <Link href="/auth/signup" className="font-medium transition-colors" style={{ color: '#ffba00' }}>
              Criar conta
            </Link>
          </p>
        </div>

        {/* Yellow accent line */}
        <div className="mt-6 flex items-center justify-center gap-2">
          <div className="h-px flex-1" style={{ backgroundColor: '#003a1d' }} />
          <div className="w-8 h-0.5 rounded-full" style={{ backgroundColor: '#ffba00' }} />
          <div className="h-px flex-1" style={{ backgroundColor: '#003a1d' }} />
        </div>
      </div>
    </div>
  );
}
