import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { safeNext } from '$lib/nav';

/** Where Google (and any emailed link) lands. Exchanges the code for a session cookie. */
export const GET: RequestHandler = async ({ url, locals }) => {
  const code = url.searchParams.get('code');
  // Validated, never trusted: this is the one redirect target the app takes
  // from a parameter, and an unchecked one here is an open redirect on the
  // login path itself.
  const next = safeNext(url.searchParams.get('next'));

  if (code) {
    const { error } = await locals.supabase.auth.exchangeCodeForSession(code);
    if (!error) redirect(303, next);
    redirect(303, '/masuk?error=' + encodeURIComponent('Gagal masuk. Coba lagi.'));
  }

  redirect(303, '/masuk');
};
