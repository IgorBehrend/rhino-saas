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
    // ALL active imports (not received) - no machine filter
    supabase
      .from('imports')
      .select('id, po_prosyst, supplier, estimated_arrival, code, description')
      .not('status', 'eq', 'received'),
    // ALL import items
    supabase
      .from('import_items')
      .select('import_id, machine_code, machine_name, quantity'),
  ]);

  const machineOptions = machines.map(m => ({
    id: m.id, code: m.code, name: m.name,
    qty_physical: m.qty_physical, qty_system: m.qty_system,
  }));

  const importItems = importItemsResult.data ?? [];
  const allImports  = importsResult.data ?? [];

  // Build active imports with their machines
  const activeImports = allImports.map((imp: any) => {
    // Items from import_items table
    const linkedItems = importItems
      .filter((item: any) => item.import_id === imp.id)
      .map((item: any) => ({
        machine_code: item.machine_code,
        machine_name: item.machine_name,
        quantity: item.quantity,
      }));

    // Fallback: use legacy "code" field from imports table
    if (linkedItems.length === 0 && imp.code) {
      linkedItems.push({
        machine_code: imp.code,
        machine_name: imp.description ?? imp.code,
        quantity: 1,
      });
    }

    return {
      id:                imp.id,
      po_prosyst:        imp.po_prosyst,
      supplier:          imp.supplier,
      estimated_arrival: imp.estimated_arrival,
      items:             linkedItems,
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
