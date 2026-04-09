'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updatePurchaseNeedStatus, deletePurchaseNeed } from '@/lib/actions/reservations';
import ConfirmDelete from '@/components/ui/ConfirmDelete';
import EmptyState from '@/components/ui/EmptyState';
import { ShoppingCart, CheckCircle, Trash2, Ship } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
interface PN { id:string;machine_code:string;machine_name:string|null;contract:string;quantity:number;urgency:string;status:string;notes:string|null;created_at:string; }
const URG:any={urgent:{label:'Urgente',color:'text-red-700',bg:'bg-red-50 border-red-200',dot:'bg-red-500'},normal:{label:'Normal',color:'text-amber-700',bg:'bg-amber-50 border-amber-200',dot:'bg-amber-500'},low:{label:'Baixa',color:'text-slate-600',bg:'bg-slate-100 border-slate-200',dot:'bg-slate-400'}};
const STS:any={open:{label:'Em aberto',val:'text-red-600'},in_progress:{label:'Em andamento',val:'text-amber-600'},fulfilled:{label:'Atendida',val:'text-emerald-600'},cancelled:{label:'Cancelada',val:'text-slate-400'}};
export default function PurchaseNeedsList({needs}:{needs:PN[]}) {
  const router=useRouter();const[,st]=useTransition();const[filter,setFilter]=useState('open');
  const filtered=needs.filter(n=>filter==='all'||n.status===filter);
  const counts:any={open:0,in_progress:0,fulfilled:0,cancelled:0};
  needs.forEach(n=>{if(counts[n.status]!==undefined)counts[n.status]++;});
  async function hs(id:string,status:string){await updatePurchaseNeedStatus(id,status);st(()=>router.refresh());}
  async function hd(id:string){await deletePurchaseNeed(id);st(()=>router.refresh());}
  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {Object.entries(STS).map(([s,cfg]:any)=>(
          <button key={s} onClick={()=>setFilter(filter===s?'all':s)} className={"card p-3 text-left hover:shadow-md transition-all "+(filter===s?'ring-2 ring-green-600':'')}>
            <p className={"text-2xl font-bold "+cfg.val}>{counts[s]}</p>
            <p className="text-xs text-slate-500 mt-0.5">{cfg.label}</p>
          </button>
        ))}
      </div>
      {filtered.length===0?(<EmptyState icon={ShoppingCart} title="Nenhuma necessidade" description="Geradas automaticamente quando não há estoque nem importação." />):(
        <div className="space-y-2">
          {filtered.map(n=>{
            const urg=URG[n.urgency]||URG.normal;
            return (
              <div key={n.id} className="card p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={"w-2 h-2 rounded-full mt-1.5 shrink-0 "+urg.dot}/>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-mono text-sm font-bold" style={{color:'#008434'}}>{n.machine_code}</span>
                        <span className={"badge "+urg.bg+" "+urg.color}>{urg.label}</span>
                        <span className={"text-xs font-medium "+(STS[n.status]?.val||'')}>{STS[n.status]?.label}</span>
                      </div>
                      <p className="text-xs text-slate-600 truncate">{n.machine_name??'—'}</p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-xs text-slate-500">Contrato: <strong className="text-slate-700">{n.contract}</strong></span>
                        <span className="text-xs text-slate-500">Qtd: <strong className="text-slate-700">{n.quantity}</strong></span>
                        <span className="text-xs text-slate-400">{formatDate(n.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    {n.status==='open'&&(<>
                      <Link href="/imports" className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"><Ship className="w-3.5 h-3.5"/>Criar importação</Link>
                      <button onClick={()=>hs(n.id,'in_progress')} className="text-xs font-medium px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">Em andamento</button>
                      <button onClick={()=>hs(n.id,'fulfilled')} className="text-xs font-medium px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle className="w-3.5 h-3.5 inline mr-1"/>Atendida</button>
                    </>)}
                    {n.status==='in_progress'&&(<button onClick={()=>hs(n.id,'fulfilled')} className="text-xs font-medium px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle className="w-3.5 h-3.5 inline mr-1"/>Marcar atendida</button>)}
                    <ConfirmDelete title="Excluir" description="Remover esta necessidade?" onConfirm={()=>hd(n.id)}>
                      <button className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4"/></button>
                    </ConfirmDelete>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
