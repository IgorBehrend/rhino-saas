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

  const [records, machines, importsResult, importItemsResult, reservationsResult] = await Promise.all([
    getProductionRecords(),
    getMachines(),
    // All active imports
    supabase
      .from('imports')
      .select('id, po_prosyst, supplier, estimated_arrival, code, description')
      .not('status', 'eq', 'received'),
    // All import items
    supabase
      .from('import_items')
      .select('import_id, machine_code, machine_name, quantity'),
    // All active reservations linked to imports
    supabase
      .from('reservations')
      .select('import_id, machine_code')
      .eq('status', 'active')
      .not('import_id', 'is', null),
  ]);

  const machineOptions = machines.map(m => ({
    id: m.id, code: m.code, name: m.name,
    qty_physical: m.qty_physical, qty_system: m.qty_system,
  }));

  const importItems  = importItemsResult.data ?? [];
  const reservations = reservationsResult.data ?? [];
  const allImports   = importsResult.data ?? [];

  // Build set of reserved machine_codes per import
  // reservedMap[import_id] = Set of reserved machine_codes
  const reservedMap: Record<string, Set<string>> = {};
  reservations.forEach((r: any) => {
    if (!r.import_id) return;
    if (!reservedMap[r.import_id]) reservedMap[r.import_id] = new Set();
    reservedMap[r.import_id].add(r.machine_code);
  });

  // Build active imports — only include machines that are NOT reserved
  const activeImports = allImports
    .map((imp: any) => {
      // Items from import_items table
      const linkedItems = importItems
        .filter((item: any) => item.import_id === imp.id)
        .map((item: any) => ({
          machine_code: item.machine_code,
          machine_name: item.machine_name,
          quantity:     item.quantity,
        }));

      // Fallback: legacy code field
      if (linkedItems.length === 0 && imp.code) {
        linkedItems.push({
          machine_code: imp.code,
          machine_name: imp.description ?? imp.code,
          quantity:     1,
        });
      }

      // Filter out already reserved machines
      const reserved = reservedMap[imp.id] ?? new Set();
      const availableItems = linkedItems.filter(
        (item: any) => !reserved.has(item.machine_code)
      );

      return {
        id:                imp.id,
        po_prosyst:        imp.po_prosyst,
        supplier:          imp.supplier,
        estimated_arrival: imp.estimated_arrival,
        items:             availableItems,         // only available machines
        allItems:          linkedItems,            // all machines (for display)
        reservedCodes:     Array.from(reserved),  // which are reserved
      };
    })
    // Only show imports that still have at least one available machine
    .filter((imp: any) => imp.items.length > 0);

  return (
    <div className="animate-slide-up space-y-6">
      <Header title="Producao" description={`${records.length} ordens de producao`} />
      <ProductionDashboard records={records} />
      <ProductionList records={records} machines={machineOptions} activeImports={activeImports} />
    </div>
  );
}
