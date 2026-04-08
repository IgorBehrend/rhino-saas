import { getProductionRecords } from '@/lib/actions/production';
import { getMachines } from '@/lib/actions/machines';
import { createClient } from '@/lib/supabase/server';
import Header from '@/components/layout/Header';
import ProductionDashboard from '@/components/production/ProductionDashboard';
import ProductionList from '@/components/production/ProductionList';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Produção' };

export default async function ProductionPage() {
  const supabase = await createClient();

  const [records, machines, importsResult] = await Promise.all([
    getProductionRecords(),
    getMachines(),
    supabase
      .from('imports')
      .select('id, po_prosyst, supplier, estimated_arrival, import_items(machine_code)')
      .not('status', 'eq', 'received'),
  ]);

  const machineOptions = machines.map(m => ({
    id: m.id, code: m.code, name: m.name,
    qty_physical: m.qty_physical, qty_system: m.qty_system,
  }));

  const activeImports = (importsResult.data ?? []).map((imp: any) => ({
    id: imp.id,
    po_prosyst: imp.po_prosyst,
    supplier: imp.supplier,
    estimated_arrival: imp.estimated_arrival,
    items: imp.import_items ?? [],
  }));

  return (
    <div className="animate-slide-up space-y-6">
      <Header title="Produção" description={`${records.length} ordens de produção`} />
      <ProductionDashboard records={records} />
      <ProductionList records={records} machines={machineOptions} activeImports={activeImports} />
    </div>
  );
}
