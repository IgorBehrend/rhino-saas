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

  const [records, machines, importsResult, importItemsResult] = await Promise.all([
    getProductionRecords(),
    getMachines(),
    supabase
      .from('imports')
      .select('id, po_prosyst, supplier, estimated_arrival, code, description')
      .not('status', 'eq', 'received'),
    supabase
      .from('import_items')
      .select('import_id, machine_code, machine_name, quantity'),
  ]);

  const machineOptions = machines.map(m => ({
    id: m.id, code: m.code, name: m.name,
    qty_physical: m.qty_physical, qty_system: m.qty_system,
  }));

  const importItems = importItemsResult.data ?? [];

  // Build active imports — always show all, with their machine list
  const activeImports = (importsResult.data ?? []).map((imp: any) => {
    // Get codes from import_items table
    const itemsForThisImport = importItems.filter((item: any) => item.import_id === imp.id);

    // Also include legacy "code" field from imports table itself
    const legacyCodes = imp.code ? [{ machine_code: imp.code, machine_name: imp.description ?? imp.code }] : [];

    const allItems = itemsForThisImport.length > 0
      ? itemsForThisImport
      : legacyCodes;

    return {
      id: imp.id,
      po_prosyst: imp.po_prosyst,
      supplier: imp.supplier,
      estimated_arrival: imp.estimated_arrival,
      // All machines in this import
      items: allItems,
    };
  });

  return (
    <div className="animate-slide-up space-y-6">
      <Header title="Produção" description={`${records.length} ordens de produção`} />
      <ProductionDashboard records={records} />
      <ProductionList records={records} machines={machineOptions} activeImports={activeImports} />
    </div>
  );
}
