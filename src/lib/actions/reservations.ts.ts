'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

// ── RESERVATIONS ──────────────────────────────────────────────
export async function getReservations(status?: string) {
  const supabase = await createClient();
  let q = supabase.from('reservations').select('*').order('created_at', { ascending: false });
  if (status && status !== 'all') q = q.eq('status', status);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function updateReservationStatus(id: string, status: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('reservations').update({ status }).eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/production');
  return { success: true };
}

// ── PURCHASE NEEDS ────────────────────────────────────────────
export async function getPurchaseNeeds(status?: string) {
  const supabase = await createClient();
  let q = supabase.from('purchase_needs').select('*').order('created_at', { ascending: false });
  if (status && status !== 'all') q = q.eq('status', status);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createPurchaseNeed(payload: {
  machine_code: string;
  machine_name?: string;
  contract: string;
  production_id?: string;
  quantity?: number;
  urgency?: 'urgent' | 'normal' | 'low';
  notes?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data, error } = await supabase
    .from('purchase_needs')
    .insert({ ...payload, user_id: user.id, status: 'open' })
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath('/purchases');
  return { data };
}

export async function updatePurchaseNeedStatus(id: string, status: string, importId?: string) {
  const supabase = await createClient();
  const update: Record<string, string> = { status };
  if (importId) update.import_id = importId;
  const { error } = await supabase.from('purchase_needs').update(update).eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/purchases');
  return { success: true };
}

export async function deletePurchaseNeed(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('purchase_needs').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/purchases');
  return { success: true };
}

// ── IMPORT ITEMS ──────────────────────────────────────────────
export async function upsertImportItems(importId: string, items: {
  machine_code: string;
  machine_name?: string;
  quantity: number;
  reference?: string;
  description?: string;
}[]) {
  const supabase = await createClient();
  await supabase.from('import_items').delete().eq('import_id', importId);
  if (items.length === 0) return { success: true };
  const { error } = await supabase.from('import_items').insert(
    items.map(item => ({ ...item, import_id: importId }))
  );
  if (error) return { error: error.message };
  revalidatePath('/imports');
  return { success: true };
}
