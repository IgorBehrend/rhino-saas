import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getMachine } from '@/lib/actions/machines';
import Header from '@/components/layout/Header';
import StatusBadge from '@/components/ui/StatusBadge';
import MachineDetailClient from '@/components/machines/MachineDetailClient';
import { formatDate, formatDateTime } from '@/lib/utils';
import {
  ArrowLeft, Package, Cpu, FileText, Factory,
  Ruler, Zap, Wind
} from 'lucide-react';
import type { Metadata } from 'next';

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const machine = await getMachine(id);
    return { title: `${machine.code} — ${machine.name.slice(0, 40)}` };
  } catch {
    return { title: 'Máquina' };
  }
}

export default async function MachineDetailPage({ params }: Props) {
  const { id } = await params;

  let machine;
  try {
    machine = await getMachine(id);
  } catch {
    notFound();
  }

  const spec = machine.specs?.[0];

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Back + header */}
      <div>
        <Link href="/machines" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-orange-600 transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" />
          Voltar para Máquinas
        </Link>
        <Header
          title={machine.code}
          description={machine.name}
          actions={
            <div className="flex items-center gap-2">
              <StatusBadge status={machine.status} />
              <MachineDetailClient machine={machine} />
            </div>
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">

          {/* General Info */}
          <section className="card p-5">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
              <Package className="w-4 h-4 text-orange-600" />
              Informações Gerais
            </h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              {[
                ['Código',       machine.code],
                ['Tipo',         machine.machine_type ?? '—'],
                ['Qtd. Sistema', machine.qty_system],
                ['Qtd. Física',  machine.qty_physical],
                ['Contrato/BL',  machine.contract ?? '—'],
                ['NF Entrada',   machine.invoice_in ?? '—'],
                ['NF Saída',     machine.invoice_out ?? '—'],
                ['Cadastrado em', formatDate(machine.created_at)],
              ].map(([label, value]) => (
                <div key={label as string}>
                  <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">{label}</dt>
                  <dd className={`font-medium ${
                    label === 'Qtd. Física' && +value !== machine.qty_system
                      ? 'text-amber-600'
                      : 'text-slate-800'
                  }`}>{value}</dd>
                </div>
              ))}
            </dl>
            {machine.notes && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Observações</dt>
                <dd className="text-sm text-slate-700 leading-relaxed">{machine.notes}</dd>
              </div>
            )}
          </section>

          {/* Technical Specs */}
          <section className="card p-5">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
              <Cpu className="w-4 h-4 text-orange-600" />
              Especificações Técnicas
            </h2>
            {spec ? (
              <div className="space-y-4">
                {/* Dimensions */}
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5 mb-3">
                    <Ruler className="w-3.5 h-3.5" /> Dimensões (cm) e Peso
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {/* Vol 1 */}
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-slate-500 mb-2">Volume 1</p>
                      <div className="grid grid-cols-2 gap-y-1 text-xs">
                        <span className="text-slate-500">Comprimento:</span><span className="font-medium">{spec.vol1_length ?? '—'} cm</span>
                        <span className="text-slate-500">Largura:</span>    <span className="font-medium">{spec.vol1_width ?? '—'} cm</span>
                        <span className="text-slate-500">Altura:</span>     <span className="font-medium">{spec.vol1_height ?? '—'} cm</span>
                        <span className="text-slate-500">Peso:</span>       <span className="font-medium">{spec.vol1_weight ? `${spec.vol1_weight} kg` : '—'}</span>
                      </div>
                    </div>
                    {/* Vol 2 */}
                    {(spec.vol2_length || spec.vol2_width || spec.vol2_height) && (
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-xs font-semibold text-slate-500 mb-2">Volume 2</p>
                        <div className="grid grid-cols-2 gap-y-1 text-xs">
                          <span className="text-slate-500">Comprimento:</span><span className="font-medium">{spec.vol2_length ?? '—'} cm</span>
                          <span className="text-slate-500">Largura:</span>    <span className="font-medium">{spec.vol2_width ?? '—'} cm</span>
                          <span className="text-slate-500">Altura:</span>     <span className="font-medium">{spec.vol2_height ?? '—'} cm</span>
                          <span className="text-slate-500">Peso:</span>       <span className="font-medium">{spec.vol2_weight ? `${spec.vol2_weight} kg` : '—'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Electrical */}
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5 mb-3">
                    <Zap className="w-3.5 h-3.5" /> Dados Elétricos
                  </h3>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    {[
                      ['Tensão',    spec.voltage ?? '—'],
                      ['Potência',  spec.power_kw ? `${spec.power_kw} kW` : '—'],
                      ['Corrente',  spec.current_a ? `${spec.current_a} A` : '—'],
                    ].map(([label, value]) => (
                      <div key={label} className="bg-slate-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-slate-500 mb-1">{label}</p>
                        <p className="font-semibold text-slate-800">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Operational */}
                {(spec.air_consumption || spec.dust_collector_flow || spec.max_speed) && (
                  <div>
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5 mb-3">
                      <Wind className="w-3.5 h-3.5" /> Dados Operacionais
                    </h3>
                    <dl className="grid grid-cols-3 gap-3 text-sm">
                      {[
                        ['Consumo de Ar', spec.air_consumption],
                        ['Vazão Coletor', spec.dust_collector_flow],
                        ['Vel. Máxima',   spec.max_speed],
                      ].filter(([, v]) => v).map(([label, value]) => (
                        <div key={label as string} className="bg-slate-50 rounded-lg p-3 text-center">
                          <p className="text-xs text-slate-500 mb-1">{label}</p>
                          <p className="font-semibold text-slate-800">{value}</p>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic">Nenhuma especificação cadastrada.</p>
            )}
          </section>

          {/* Production history */}
          {machine.production && machine.production.length > 0 && (
            <section className="card p-5">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
                <Factory className="w-4 h-4 text-orange-600" />
                Histórico de Produção
              </h2>
              <div className="space-y-3">
                {machine.production.map(p => (
                  <div key={p.id} className="flex items-start justify-between py-3 border-b border-slate-100 last:border-0 text-sm">
                    <div>
                      <p className="font-medium text-slate-800">{p.contract ?? 'Sem contrato'}</p>
                      {p.planned_delivery_date && (
                        <p className="text-xs text-slate-500 mt-0.5">Entrega: {formatDate(p.planned_delivery_date)}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full border border-blue-100">
                        {p.status}
                      </span>
                      {p.delay_days && p.delay_days > 0 && (
                        <p className="text-xs text-red-500 mt-1">{p.delay_days}d atraso</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right column — notes */}
        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-orange-600" />
              Histórico de Notas
            </h2>
            <MachineDetailClient machine={machine} view="notes" />
          </section>
        </div>
      </div>
    </div>
  );
}
