'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ImportFormData } from '@/types/imports';

export async function getImports(filters?: { status?: string; supplier?: string; search?: string }) {
  const supabase = await createClient();

  let query = supabase
    .from('imports')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }
  if (filters?.supplier) {
    query = query.ilike('supplier', `%${filters.supplier}%`);
  }
  if (filters?.search) {
    query = query.or(
      `po_prosyst.ilike.%${filters.search}%,po_rhino.ilike.%${filters.search}%,code.ilike.%${filters.search}%,description.ilike.%${filters.search}%,supplier.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createImport(formData: ImportFormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data, error } = await supabase
    .from('imports')
    .insert({ ...formData, user_id: user.id })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath('/imports');
  return { data };
}

export async function updateImport(id: string, formData: Partial<ImportFormData>) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('imports')
    .update(formData)
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/imports');
  return { success: true };
}

export async function deleteImport(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('imports')
    .delete()
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/imports');
  return { success: true };
}
