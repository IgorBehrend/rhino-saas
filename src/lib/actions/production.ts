'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

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
  machine_code: string;
  machine_name?: string;
  qty_physical?: number;
  generate_purchase_need?: boolean;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const {
    machine_code, machine_name, qty_physical,
    generate_purchase_need,
    ...prodData
  } = formData;

  // Create production record
  const { data: prod, error } = await supabase
    .from('production')
    .insert({ ...prodData, user_id: user.id, status: prodData.status ?? 'pending' })
    .select()
    .single();

  if (error) return { error: error.message };

  const contract = formData.contract ?? '';

  // ── Decide what to do based on source and flags ───────────
  if (generate_purchase_need) {
    // No stock, no import → generate purchase need
    await supabase.from('purchase_needs').insert({
      user_id:       user.id,
      machine_code,
      machine_name:  machine_name ?? null,
      contract,
      production_id: prod.id,
      quantity:      1,
      urgency:       'urgent',
      status:        'open',
    });

  } else if (formData.machine_source === 'import' && formData.import_id) {
    // Import reservation
    await supabase.from('reservations').insert({
      user_id:           user.id,
      machine_code,
      machine_name:      machine_name ?? null,
      contract,
      production_id:     prod.id,
      import_id:         formData.import_id,
      import_po_prosyst: formData.import_po_prosyst ?? null,
      source:            'import',
      status:            'active',
    });

  } else if (formData.machine_source === 'stock') {
    // Stock: check current qty and decrement
    const { data: machine } = await supabase
      .from('machines')
      .select('qty_physical')
      .eq('id', formData.machine_id)
      .single();

    const currentQty = machine?.qty_physical ?? 0;

    if (currentQty <= 0) {
      // No stock available → generate purchase need instead
      await supabase.from('purchase_needs').insert({
        user_id:       user.id,
        machine_code,
        machine_name:  machine_name ?? null,
        contract,
        production_id: prod.id,
        quantity:      1,
        urgency:       'urgent',
        status:        'open',
      });
    } else {
      // Decrement stock
      await supabase
        .from('machines')
        .update({ qty_physical: currentQty - 1 })
        .eq('id', formData.machine_id);

      // Create stock reservation
      await supabase.from('reservations').insert({
        user_id:       user.id,
        machine_code,
        machine_name:  machine_name ?? null,
        contract,
        production_id: prod.id,
        source:        'stock',
        status:        'active',
      });
    }
  }

  revalidatePath('/production');
  revalidatePath('/dashboard');
  revalidatePath('/machines');
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

  // Get production to restore stock if needed
  const { data: prod } = await supabase
    .from('production')
    .select('machine_source, machine_id')
    .eq('id', id)
    .single();

  if (prod?.machine_source === 'stock' && prod?.machine_id) {
    const { data: machine } = await supabase
      .from('machines')
      .select('qty_physical')
      .eq('id', prod.machine_id)
      .single();

    if (machine) {
      await supabase
        .from('machines')
        .update({ qty_physical: machine.qty_physical + 1 })
        .eq('id', prod.machine_id);
    }
  }

  // Cancel reservations
  await supabase
    .from('reservations')
    .update({ status: 'cancelled' })
    .eq('production_id', id);

  const { error } = await supabase.from('production').delete().eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/production');
  revalidatePath('/machines');
  revalidatePath(`/machines/${machineId}`);
  revalidatePath('/dashboard');
  return { success: true };
}
