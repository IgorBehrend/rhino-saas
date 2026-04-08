import { getImports } from '@/lib/actions/imports';
import { getMachines } from '@/lib/actions/machines';
import Header from '@/components/layout/Header';
import ImportList from '@/components/imports/ImportList';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Importações' };

export default async function ImportsPage() {
  const [records, machines] = await Promise.all([
    getImports(),
    getMachines(),
  ]);

  // Only pass code + name for the selector
  const machineOptions = machines.map(m => ({ code: m.code, name: m.name }));

  return (
    <div className="animate-slide-up">
      <Header
        title="Importações"
        description={`${records.length} registros de importação`}
      />
      <ImportList records={records} machines={machineOptions} />
    </div>
  );
}
