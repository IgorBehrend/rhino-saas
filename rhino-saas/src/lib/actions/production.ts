'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProductionFormData } from '@/types';

// ── Get all production records ────────────────────────────────
export async function getProductionRecords(filters?: {
  status?: string;
  machineId?: string;
}) {
  const supabase = await createClient();

  let query = supabase
    .from('production')
    .select('*, machine:machines(id, code, name, machine_type)')
    .order('created_at', { ascending: false });

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }
  if (filters?.machineId) {
    query = query.eq('machine_id', filters.machineId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

// ── Create production record ──────────────────────────────────
export async function createProduction(formData: ProductionFormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data, error } = await supabase
    .from('production')
    .insert({ ...formData, user_id: user.id })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath('/production');
  revalidatePath(`/machines/${formData.machine_id}`);
  return { data };
}

// ── Update production status ──────────────────────────────────
export async function updateProductionStatus(
  id: string,
  status: string,
  extra?: Partial<ProductionFormData>
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('production')
    .update({ status, ...extra })
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/production');
  return { success: true };
}

// ── Delete production record ──────────────────────────────────
export async function deleteProduction(id: string, machineId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('production')
    .delete()
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/production');
  revalidatePath(`/machines/${machineId}`);
  return { success: true };
}
