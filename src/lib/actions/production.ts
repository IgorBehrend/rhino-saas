'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createReservation, createPurchaseNeed } from './reservations';

export async function getProductionRecords(filters?: { status?: string; machineId?: string }) {
  const supabase = await createClient();
  let query = supabase
    .from('production')
    .select('*, machine:machines(id, code, name, machine_type)')
    .order('created_at', { ascending: false });
  if (filters?.status && filters.status !== 'all') query = query.eq('status', filters.status);
  if (filters?.machineId) query = query.eq('machine_id', filters.machineId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createProduction(formData: {
  machine_id: string;
  contract?: string | null;
  status?: string;
  machine_source: 'stock' | 'import';
  import_po_prosyst?: string | null;
  import_id?: string | null;
  responsible_mechanical?: string | null;
  responsible_electrical?: string | null;
  responsible_checklist?: string | null;
  responsible_packaging?: string | null;
  planned_factory_date?: string | null;
  planned_delivery_date?: string | null;
  notes?: string | null;
  // machine info for reservation/purchase
  machine_code: string;
  machine_name?: string;
  qty_physical?: number;
  qty_system?: number;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { machine_code, machine_name, qty_physical, qty_system, ...prodData } = formData;

  // Create the production record
  const { data: prod, error } = await supabase
    .from('production')
    .insert({ ...prodData, user_id: user.id, status: prodData.status ?? 'pending' })
    .select()
    .single();

  if (error) return { error: error.message };

  const contract = formData.contract ?? '';

  // Handle reservation or purchase need
  if (formData.machine_source === 'stock') {
    // Create stock reservation
    await createReservation({
      machine_code,
      machine_name,
      contract,
      production_id: prod.id,
      source: 'stock',
    });
  } else if (formData.machine_source === 'import' && formData.import_id) {
    // Create import reservation
    await createReservation({
      machine_code,
      machine_name,
      contract,
      production_id: prod.id,
      import_id: formData.import_id,
      import_po_prosyst: formData.import_po_prosyst ?? undefined,
      source: 'import',
    });
  } else {
    // No stock, no import → generate purchase need
    await createPurchaseNeed({
      machine_code,
      machine_name,
      contract,
      production_id: prod.id,
      urgency: 'urgent',
    });
  }

  revalidatePath('/production');
  revalidatePath('/dashboard');
  revalidatePath('/purchases');
  return { data: prod };
}

export async function updateProductionStatus(id: string, status: string, extra?: Record<string, unknown>) {
  const supabase = await createClient();
  const { error } = await supabase.from('production').update({ status, ...extra }).eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/production');
  return { success: true };
}

export async function deleteProduction(id: string, machineId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('production').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/production');
  revalidatePath(`/machines/${machineId}`);
  return { success: true };
}
