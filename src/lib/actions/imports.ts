'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function getImports() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('imports')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createImport(formData: any) {
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

export async function updateImport(id: string, formData: any) {
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
