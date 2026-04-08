import { getMachines } from '@/lib/actions/machines';
import { createClient } from '@/lib/supabase/server';
import Header from '@/components/layout/Header';
import MachineTable from '@/components/machines/MachineTable';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Equipamentos' };

export default async function MachinesPage() {
  const supabase = await createClient();

  const [machines, importsResult] = await Promise.all([
    getMachines(),
    supabase.from('imports').select('code').not('status', 'eq', 'received').not('code', 'is', null),
  ]);

  const importCodes = (importsResult.data ?? []).map((r: any) => r.code).filter(Boolean);

  return (
    <div className="animate-slide-up">
      <Header title="Equipamentos" description={`${machines.length} modelos cadastrados`} />
      <MachineTable machines={machines} importCodes={importCodes} />
    </div>
  );
}
