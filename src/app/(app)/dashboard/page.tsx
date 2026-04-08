import { getMachines } from '@/lib/actions/machines';
import { createClient } from '@/lib/supabase/server';
import Header from '@/components/layout/Header';
import StatCard from '@/components/ui/StatCard';
import DashboardChart from '@/components/dashboard/DashboardChart';
import Link from 'next/link';
import { truncate } from '@/lib/utils';
import { Package, Ship, AlertTriangle, CheckCircle, XCircle, BarChart3 } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const supabase = await createClient();

  const [machines, importsResult] = await Promise.all([
    getMachines(),
    supabase.from('imports').select('code, status, supplier, estimated_arrival').not('status', 'eq', 'received'),
  ]);

  const activeImports = importsResult.data ?? [];
  const importCodes   = activeImports.map((r: any) => r.code).filter(Boolean);

  const inStock     = machines.filter(m => m.qty_physical > 0);
  const outOfStock  = machines.filter(m => m.qty_physical === 0 && !importCodes.includes(m.code));
  const discrepancy = machines.filter(m => m.qty_physical !== m.qty_system);

  const chartStats = { inStock: inStock.length, outOfStock: outOfStock.length, inImport: activeImports.length };

  return (
    <div className="space-y-6 animate-slide-up">
      <Header title="Dashboard" description="Visão geral do estoque de equipamentos" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total de Modelos"  value={machines.length}      icon={Package}     color="orange" description="equipamentos cadastrados" />
        <StatCard title="Com Estoque"       value={inStock.length}       icon={CheckCircle} color="emerald" />
        <StatCard title="Sem Estoque"       value={outOfStock.length}    icon={XCircle}     color="red" />
        <StatCard title="Em Importação"     value={activeImports.length} icon={Ship}        color="blue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-5 lg:col-span-2">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4" style={{ color: '#008434' }} /> Situação do Estoque
          </h2>
          <DashboardChart stats={chartStats} />
        </div>
        <div className="card p-5">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-amber-500" /> Divergências
            {discrepancy.length > 0 && <span className="ml-auto text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{discrepancy.length}</span>}
          </h2>
          {discrepancy.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhuma divergência ✓</p>
          ) : (
            <div className="space-y-2">
              {discrepancy.slice(0, 7).map(m => (
                <div key={m.id} className="flex items-center justify-between py-1.5">
                  <span className="font-mono text-xs font-bold" style={{ color: '#008434' }}>{m.code}</span>
                  <span className="text-xs text-amber-600 font-semibold">Sis: {m.qty_system} / Fís: {m.qty_physical}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-emerald-500" /> Com Estoque</h2>
            <Link href="/machines" className="text-xs font-medium" style={{ color: '#008434' }}>Ver todos →</Link>
          </div>
          <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
            {inStock.slice(0, 8).map(m => (
              <div key={m.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="font-mono text-xs font-bold" style={{ color: '#008434' }}>{m.code}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{truncate(m.name, 38)}</p>
                </div>
                <span className="text-sm font-bold text-emerald-600">{m.qty_physical} un</span>
              </div>
            ))}
            {inStock.length === 0 && <p className="text-xs text-slate-400 px-5 py-4">Nenhum modelo com estoque.</p>}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2 text-sm"><XCircle className="w-4 h-4 text-red-500" /> Sem Estoque</h2>
            <Link href="/machines" className="text-xs font-medium" style={{ color: '#008434' }}>Ver todos →</Link>
          </div>
          <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
            {outOfStock.slice(0, 8).map(m => (
              <div key={m.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="font-mono text-xs font-bold text-red-500">{m.code}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{truncate(m.name, 38)}</p>
                </div>
                <span className="text-xs font-bold text-red-500">0 un</span>
              </div>
            ))}
            {outOfStock.length === 0 && <p className="text-xs text-slate-400 px-5 py-4">Nenhum modelo sem estoque ✓</p>}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2 text-sm"><Ship className="w-4 h-4 text-blue-500" /> Em Importação</h2>
            <Link href="/imports" className="text-xs font-medium" style={{ color: '#008434' }}>Ver todos →</Link>
          </div>
          <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
            {activeImports.slice(0, 8).map((imp: any, i: number) => (
              <div key={i} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="font-mono text-xs font-bold text-blue-600">{imp.code ?? '—'}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{imp.supplier ?? '—'}</p>
                </div>
                <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">{imp.status}</span>
              </div>
            ))}
            {activeImports.length === 0 && <p className="text-xs text-slate-400 px-5 py-4">Nenhuma importação ativa.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
