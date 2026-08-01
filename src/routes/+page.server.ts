import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { HOME } from '$lib/nav';

/**
 * The landing page is the one screen in the app written for someone who is not
 * a Member yet. Anybody who already is has nothing to read here, so they go
 * straight to their books — a bookmark on `/`, the domain typed from memory, or
 * the installed app opened before `start_url` took effect all land correctly.
 *
 * Membership is not checked, only the session: someone signed in but not yet in
 * a Household is bounced on to `/mulai` by the `(app)` guard anyway, and
 * duplicating that lookup here would be a second place for it to drift.
 */
export const load: PageServerLoad = async ({ locals }) => {
  const { session } = await locals.safeGetSession();
  if (session) redirect(303, HOME);
  return {};
};
