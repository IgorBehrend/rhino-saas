import { Suspense } from 'react';
import { getDashboardStats, getMachines } from '@/lib/actions/machines';
import { getProductionRecords } from '@/lib/actions/production';
import Header from '@/components/layout/Header';
import StatCard from '@/components/ui/StatCard';
import StatusBadge from '@/components/ui/StatusBadge';
import { Package, Factory, CheckCircle, Wrench, BarChart3, AlertTriangle, Boxes, Clock } from 'lucide-react';
import Link from 'next/link';
import { formatDate, truncate, PRODUCTION_STATUS_CONFIG } from '@/lib/utils';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Dashboard' };

// ── Dashboard chart (client-only recharts import) ─────────────
import DashboardChart from '@/components/dashboard/DashboardChart';

export default async function DashboardPage() {
  const [stats, recentMachines, recentProduction] = await Promise.all([
    getDashboardStats(),
    getMachines(),
    getProductionRecords(),
  ]);

  const recentList = recentMachines.slice(0, 6);
  const productionList = recentProduction.slice(0, 5);

  // Qty discrepancy: physical ≠ system
  const discrepancies = recentMachines.filter(m => m.qty_physical !== m.qty_system);

  return (
    <div className="space-y-6 animate-slide-up">
      <Header
        title="Dashboard"
        description="Visão geral do estoque e produção de máquinas"
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total de Modelos" value={stats.total} icon={Boxes} color="orange" description={`${stats.totalUnits} unidades totais`} />
        <StatCard title="Em Produção"      value={stats.production}  icon={Factory}      color="blue" />
        <StatCard title="Disponíveis"      value={stats.available}   icon={CheckCircle}  color="emerald" />
        <StatCard title="Manutenção"       value={stats.maintenance} icon={Wrench}       color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-orange-600" />
              Distribuição por Status
            </h2>
          </div>
          <DashboardChart stats={stats} />
        </div>

        {/* Discrepancies alert */}
        <div className="card p-5">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Divergências de Estoque
            {discrepancies.length > 0 && (
              <span className="ml-auto text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                {discrepancies.length}
              </span>
            )}
          </h2>
          {discrepancies.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhuma divergência encontrada ✓</p>
          ) : (
            <div className="space-y-2">
              {discrepancies.slice(0, 6).map(m => (
                <Link key={m.id} href={`/machines/${m.id}`} className="flex items-center justify-between py-1.5 text-sm hover:text-orange-600 transition-colors group">
                  <span className="font-mono text-xs text-slate-600 group-hover:text-orange-600">{m.code}</span>
                  <span className="text-xs text-amber-600 font-semibold">
                    Sistema: {m.qty_system} / Físico: {m.qty_physical}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent machines */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <Package className="w-4 h-4 text-orange-600" />
              Máquinas Recentes
            </h2>
            <Link href="/machines" className="text-xs text-orange-600 hover:text-orange-800 font-medium">
              Ver todas →
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recentList.map(m => (
              <Link key={m.id} href={`/machines/${m.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs font-semibold text-orange-600">{m.code}</p>
                  <p className="text-xs text-slate-600 truncate mt-0.5">{truncate(m.name, 50)}</p>
                </div>
                <StatusBadge status={m.status} />
              </Link>
            ))}
          </div>
        </div>

        {/* Production in progress */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-600" />
              Ordens de Produção
            </h2>
            <Link href="/production" className="text-xs text-orange-600 hover:text-orange-800 font-medium">
              Ver todas →
            </Link>
          </div>
          {productionList.length === 0 ? (
            <p className="text-sm text-slate-500 px-5 py-6">Nenhuma ordem ativa.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {productionList.map(p => (
                <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-xs font-semibold text-slate-700">{p.machine?.code ?? '—'}</p>
                    <p className="text-xs text-slate-500 truncate">{p.contract ?? 'Sem contrato'}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                      {PRODUCTION_STATUS_CONFIG[p.status].label}
                    </span>
                    {p.delay_days && p.delay_days > 0 && (
                      <span className="text-xs text-red-600 font-semibold">{p.delay_days}d atraso</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
