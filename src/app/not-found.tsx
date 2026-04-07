import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-6xl font-bold text-orange-600 mb-4">404</p>
        <h1 className="text-xl font-semibold text-slate-800 mb-2">Página não encontrada</h1>
        <p className="text-slate-500 mb-6">O recurso que você procura não existe.</p>
        <Link href="/dashboard" className="btn-primary inline-flex">
          Voltar ao Dashboard
        </Link>
      </div>
    </div>
  );
}
