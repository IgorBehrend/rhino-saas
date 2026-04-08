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
    // All active imports (not received)
    supabase
      .from('imports')
      .select('id, po_prosyst, supplier, estimated_arrival, code')
      .not('status', 'eq', 'received'),
    // All import items
    supabase
      .from('import_items')
      .select('import_id, machine_code'),
  ]);

  const machineOptions = machines.map(m => ({
    id: m.id, code: m.code, name: m.name,
    qty_physical: m.qty_physical, qty_system: m.qty_system,
  }));

  const importItems = importItemsResult.data ?? [];

  // Build active imports with their machine codes
  // Match by: import_items table OR the legacy "code" field on imports table
  const activeImports = (importsResult.data ?? []).map((imp: any) => {
    const itemCodes = importItems
      .filter((item: any) => item.import_id === imp.id)
      .map((item: any) => item.machine_code);

    // Include the legacy code field too
    const allCodes = [...new Set([...itemCodes, imp.code].filter(Boolean))];

    return {
      id: imp.id,
      po_prosyst: imp.po_prosyst,
      supplier: imp.supplier,
      estimated_arrival: imp.estimated_arrival,
      // items array used for matching in ProductionForm
      items: allCodes.map((code: string) => ({ machine_code: code })),
      // If no items at all, show for all machines (legacy imports)
      hasNoItems: allCodes.length === 0,
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
