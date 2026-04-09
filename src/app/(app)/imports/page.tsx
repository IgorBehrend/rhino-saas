import { getImports } from '@/lib/actions/imports';
import { getMachines } from '@/lib/actions/machines';
import { createClient } from '@/lib/supabase/server';
import Header from '@/components/layout/Header';
import ImportList from '@/components/imports/ImportList';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Importacoes' };

export default async function ImportsPage() {
  const supabase = await createClient();

  const [records, machines, reservationsResult, importItemsResult] = await Promise.all([
    getImports(),
    getMachines(),
    // Load all active reservations linked to imports
    supabase
      .from('reservations')
      .select('import_id, machine_code, machine_name, contract, status')
      .eq('status', 'active')
      .not('import_id', 'is', null),
    // Load import items
    supabase
      .from('import_items')
      .select('import_id, machine_code, machine_name, quantity'),
  ]);

  const reservations = reservationsResult.data ?? [];
  const importItems  = importItemsResult.data ?? [];

  // Build map: import_id -> list of reservations
  const reservationsByImport: Record<string, { machine_code: string; machine_name: string | null; contract: string }[]> = {};
  reservations.forEach((r: any) => {
    if (!r.import_id) return;
    if (!reservationsByImport[r.import_id]) reservationsByImport[r.import_id] = [];
    reservationsByImport[r.import_id].push({
      machine_code: r.machine_code,
      machine_name: r.machine_name,
      contract:     r.contract,
    });
  });

  // Build map: import_id -> list of items
  const itemsByImport: Record<string, { machine_code: string; machine_name: string | null; quantity: number }[]> = {};
  importItems.forEach((item: any) => {
    if (!itemsByImport[item.import_id]) itemsByImport[item.import_id] = [];
    itemsByImport[item.import_id].push({
      machine_code: item.machine_code,
      machine_name: item.machine_name,
      quantity:     item.quantity,
    });
  });

  // Enrich records with reservations and items
  const enrichedRecords = records.map((r: any) => ({
    ...r,
    reservations: reservationsByImport[r.id] ?? [],
    import_items: itemsByImport[r.id] ?? [],
  }));

  const machineOptions = machines.map(m => ({ code: m.code, name: m.name }));

  return (
    <div className="animate-slide-up">
      <Header
        title="Importacoes"
        description={`${records.length} registros de importacao`}
      />
      <ImportList records={enrichedRecords} machines={machineOptions} />
    </div>
  );
}
