import { getProductionRecords } from '@/lib/actions/production';
import { getMachines } from '@/lib/actions/machines';
import Header from '@/components/layout/Header';
import ProductionDashboard from '@/components/production/ProductionDashboard';
import ProductionList from '@/components/production/ProductionList';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Produção' };

export default async function ProductionPage() {
  const [records, machines] = await Promise.all([
    getProductionRecords(),
    getMachines(),
  ]);

  const machineOptions = machines.map(m => ({ id: m.id, code: m.code, name: m.name }));

  return (
    <div className="animate-slide-up space-y-6">
      <Header
        title="Produção"
        description={`${records.length} ordens de produção`}
      />
      {/* Dashboard cards + kanban */}
      <ProductionDashboard records={records} />
      {/* Full table */}
      <ProductionList records={records} machines={machineOptions} />
    </div>
  );
}
