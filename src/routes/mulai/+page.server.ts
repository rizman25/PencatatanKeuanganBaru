import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { HOME } from '$lib/nav';

export const load: PageServerLoad = async ({ locals }) => {
  const { session, user } = await locals.safeGetSession();
  if (!session) redirect(303, '/masuk');

  // Already in a household? Nothing to do here.
  const { data: membership } = await locals.supabase
    .from('household_members')
    .select('household_id')
    .limit(1)
    .maybeSingle();

  if (membership) redirect(303, HOME);

  return { name: user?.user_metadata?.full_name ?? null };
};

export const actions: Actions = {
  gabung: async ({ request, locals }) => {
    const form = await request.formData();
    const code = String(form.get('code') ?? '').trim();

    if (code.replace(/\s/g, '').length < 6) {
      return fail(400, { code, message: 'Kode undangan belum lengkap.' });
    }

    const { error } = await locals.supabase.rpc('join_household', { p_code: code });
    if (error) {
      return fail(400, { code, message: error.message || 'Kode undangan tidak ditemukan.' });
    }
    redirect(303, '/?baru=gabung');
  },

  buat: async ({ request, locals }) => {
    const form = await request.formData();
    const name = String(form.get('name') ?? '').trim();

    if (!name) {
      return fail(400, { mode: 'buat', message: 'Beri nama rumah tanggamu.' });
    }

    const { error } = await locals.supabase.rpc('create_household', { p_name: name });
    if (error) {
      return fail(400, { mode: 'buat', message: error.message });
    }
    redirect(303, '/?baru=buat');
  }
};
