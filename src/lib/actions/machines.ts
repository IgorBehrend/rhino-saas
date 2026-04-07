'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { MachineFormData, SpecFormData } from '@/types';

// ── Fetch all machines for the current user ──────────────────
export async function getMachines(filters?: {
  status?: string;
  type?: string;
  search?: string;
}) {
  const supabase = await createClient();

  let query = supabase
    .from('machines')
    .select('*, specs(*)')
    .order('created_at', { ascending: false });

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }
  if (filters?.type && filters.type !== 'all') {
    query = query.eq('machine_type', filters.type);
  }
  if (filters?.search) {
    query = query.or(`code.ilike.%${filters.search}%,name.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

// ── Fetch a single machine with all relations ─────────────────
export async function getMachine(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('machines')
    .select('*, specs(*), production(*), machine_notes(*, profile:profiles(full_name))')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// ── Dashboard statistics ──────────────────────────────────────
export async function getDashboardStats() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('machines')
    .select('status, qty_physical');

  if (error) throw new Error(error.message);

  const stats = {
    total:       data.length,
    available:   data.filter(m => m.status === 'available').length,
    production:  data.filter(m => m.status === 'production').length,
    sold:        data.filter(m => m.status === 'sold').length,
    maintenance: data.filter(m => m.status === 'maintenance').length,
    scrapped:    data.filter(m => m.status === 'scrapped').length,
    // Total physical units across all machines
    totalUnits:  data.reduce((sum, m) => sum + (m.qty_physical ?? 0), 0),
  };

  return stats;
}

// ── Create machine ────────────────────────────────────────────
export async function createMachine(formData: MachineFormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data, error } = await supabase
    .from('machines')
    .insert({ ...formData, user_id: user.id })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath('/machines');
  revalidatePath('/dashboard');
  return { data };
}

// ── Update machine ────────────────────────────────────────────
export async function updateMachine(id: string, formData: Partial<MachineFormData>) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('machines')
    .update(formData)
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath(`/machines/${id}`);
  revalidatePath('/machines');
  revalidatePath('/dashboard');
  return { success: true };
}

// ── Delete machine ────────────────────────────────────────────
export async function deleteMachine(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('machines')
    .delete()
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/machines');
  revalidatePath('/dashboard');
  return { success: true };
}

// ── Create or update specs ────────────────────────────────────
export async function upsertSpec(machineId: string, specData: SpecFormData) {
  const supabase = await createClient();

  // Check if spec already exists
  const { data: existing } = await supabase
    .from('specs')
    .select('id')
    .eq('machine_id', machineId)
    .single();

  let error;
  if (existing) {
    ({ error } = await supabase
      .from('specs')
      .update(specData)
      .eq('machine_id', machineId));
  } else {
    ({ error } = await supabase
      .from('specs')
      .insert({ ...specData, machine_id: machineId }));
  }

  if (error) return { error: error.message };

  revalidatePath(`/machines/${machineId}`);
  return { success: true };
}

// ── Add a note to a machine ───────────────────────────────────
export async function addMachineNote(machineId: string, content: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { error } = await supabase
    .from('machine_notes')
    .insert({ machine_id: machineId, user_id: user.id, content });

  if (error) return { error: error.message };

  revalidatePath(`/machines/${machineId}`);
  return { success: true };
}

// ── Upload machine image ──────────────────────────────────────
export async function uploadMachineImage(machineId: string, file: File) {
  const supabase = await createClient();

  const ext = file.name.split('.').pop();
  const path = `${machineId}/main.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('machine-images')
    .upload(path, file, { upsert: true });

  if (uploadError) return { error: uploadError.message };

  const { data: { publicUrl } } = supabase.storage
    .from('machine-images')
    .getPublicUrl(path);

  await updateMachine(machineId, { image_url: publicUrl });
  return { url: publicUrl };
}
