import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { MachineStatus, ProductionStatus } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Rhino CNC brand colors applied to status badges
export const STATUS_CONFIG: Record<MachineStatus, { label: string; color: string; bg: string; dot: string }> = {
  available:   { label: 'Disponível',  color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200',  dot: 'bg-emerald-500' },
  production:  { label: 'Produção',    color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200',        dot: 'bg-blue-500' },
  sold:        { label: 'Vendida',     color: 'text-slate-600',   bg: 'bg-slate-100 border-slate-200',     dot: 'bg-slate-400' },
  maintenance: { label: 'Manutenção',  color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200',      dot: 'bg-amber-500' },
  scrapped:    { label: 'Sucateada',   color: 'text-red-700',     bg: 'bg-red-50 border-red-200',          dot: 'bg-red-500' },
};

export const PRODUCTION_STATUS_CONFIG: Record<ProductionStatus, { label: string; step: number }> = {
  pending:    { label: 'Aguardando',      step: 0 },
  mechanical: { label: 'Mont. Mecânica',  step: 1 },
  electrical: { label: 'Inst. Elétrica',  step: 2 },
  checklist:  { label: 'Check-List',      step: 3 },
  packaging:  { label: 'Embalagem',       step: 4 },
  ready:      { label: 'Pronto',          step: 5 },
  shipped:    { label: 'Despachado',      step: 6 },
};

export const MACHINE_TYPES = ['ROUTER', 'LASER', 'COLADEIRA', 'DOBRADEIRA', 'OUTROS'] as const;
export const MACHINE_STATUSES: MachineStatus[] = ['available', 'production', 'sold', 'maintenance', 'scrapped'];

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('pt-BR');
}

export function truncate(str: string, len = 60): string {
  return str.length > len ? str.slice(0, len) + '…' : str;
}
