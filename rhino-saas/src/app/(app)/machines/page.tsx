import { getMachines } from '@/lib/actions/machines';
import Header from '@/components/layout/Header';
import MachineTable from '@/components/machines/MachineTable';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Máquinas' };

export default async function MachinesPage() {
  const machines = await getMachines();

  return (
    <div className="animate-slide-up">
      <Header
        title="Máquinas"
        description={`${machines.length} modelos cadastrados`}
      />
      <MachineTable machines={machines} />
    </div>
  );
}
