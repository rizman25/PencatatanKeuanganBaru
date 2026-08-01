import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { HOME } from '$lib/nav';

export const load: PageServerLoad = async ({ locals, url }) => {
  const { session } = await locals.safeGetSession();
  if (session) redirect(303, HOME);
  return { error: url.searchParams.get('error') };
};

/** Both sign-in methods live here as form actions — no Supabase client in the browser. */
export const actions: Actions = {
  google: async ({ locals, url }) => {
    const { data, error } = await locals.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${url.origin}/auth/callback` }
    });
    if (error) return fail(500, { message: 'Tidak bisa menghubungi Google. Coba lagi.' });
    redirect(303, data.url);
  },

  masuk: async ({ request, locals }) => {
    const form = await request.formData();
    const email = String(form.get('email') ?? '').trim();
    const password = String(form.get('password') ?? '');

    if (!email || !password) {
      return fail(400, { email, message: 'Email dan kata sandi wajib diisi.' });
    }

    const { error } = await locals.supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return fail(400, { email, message: 'Email atau kata sandi salah.' });
    }
    redirect(303, HOME);
  },

  daftar: async ({ request, locals, url }) => {
    const form = await request.formData();
    const email = String(form.get('email') ?? '').trim();
    const password = String(form.get('password') ?? '');
    const name = String(form.get('name') ?? '').trim();

    if (!email || !password) {
      return fail(400, { email, name, mode: 'daftar', message: 'Email dan kata sandi wajib diisi.' });
    }
    if (password.length < 8) {
      return fail(400, { email, name, mode: 'daftar', message: 'Kata sandi minimal 8 karakter.' });
    }

    const { data, error } = await locals.supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name || email.split('@')[0] },
        emailRedirectTo: `${url.origin}/auth/callback`
      }
    });

    if (error) {
      return fail(400, { email, name, mode: 'daftar', message: error.message });
    }

    // With email confirmation on, there is no session yet — say so rather than
    // redirecting to a page that would bounce straight back here.
    if (!data.session) {
      return { checkEmail: true, email };
    }
    redirect(303, HOME);
  }
};
