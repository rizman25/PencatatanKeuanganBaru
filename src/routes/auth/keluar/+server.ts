import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals }) => {
  /**
   * `local`, explicitly. supabase-js defaults to `global`, which revokes every
   * refresh token the account holds — so signing out on a phone would also sign
   * the same Member out on their laptop, with nothing on screen to say so.
   * Each device is signed out by its own button.
   */
  await locals.supabase.auth.signOut({ scope: 'local' });
  redirect(303, '/masuk');
};
