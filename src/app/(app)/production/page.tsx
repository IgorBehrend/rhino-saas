import { getProductionRecords } from '@/lib/actions/production';
import { getMachines } from '@/lib/actions/machines';
import { createClient } from '@/lib/supabase/server';
import Header from '@/components/layout/Header';
import ProductionDashboard from '@/components/production/ProductionDashboard';
import ProductionList from '@/components/production/ProductionList';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Producao' };

export default async function ProductionPage() {
  const supabase = await createClient();
  const [records, machines, importsResult, importItemsResult] = await Promise.all([
    getProductionRecords(),
    getMachines(),
    supabase.from('imports').select('id, po_prosyst, supplier, estimated_arrival, code, description').not('status', 'eq', 'received'),
    supabase.from('import_items').select('import_id, machine_code, machine_name, quantity'),
  ]);

  const machineOptions = machines.map(m => ({ id: m.id, code: m.code, name: m.name, qty_physical: m.qty_physical, qty_system: m.qty_system }));
  const importItems = importItemsResult.data ?? [];

  const activeImports = (importsResult.data ?? []).map((imp: any) => {
    const linkedItems = importItems.filter((item: any) => item.import_id === imp.id).map((item: any) => ({ machine_code: item.machine_code, machine_name: item.machine_name, quantity: item.quantity }));
    if (linkedItems.length === 0 && imp.code) linkedItems.push({ machine_code: imp.code, machine_name: imp.description ?? imp.code, quantity: 1 });
    return { id: imp.id, po_prosyst: imp.po_prosyst, supplier: imp.supplier, estimated_arrival: imp.estimated_arrival, items: linkedItems };
  });

  return (
    <div className="animate-slide-up space-y-6">
      <Header title="Producao" description={`${records.length} ordens de producao`} />
      <ProductionDashboard records={records} />
      <ProductionList records={records} machines={machineOptions} activeImports={activeImports} />
    </div>
  );
}
