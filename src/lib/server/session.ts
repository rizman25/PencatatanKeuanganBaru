import { error, redirect } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

/**
 * Form actions have no access to `parent()`, so they resolve the session and
 * household through here instead.
 */
export async function requireHousehold(event: RequestEvent) {
  const { session, user } = await event.locals.safeGetSession();
  if (!session || !user) redirect(303, '/masuk');

  const { data: membership } = await event.locals.supabase
    .from('household_members')
    .select('household_id')
    .limit(1)
    .maybeSingle();

  if (!membership) redirect(303, '/mulai');
  return { householdId: membership.household_id as string, userId: user.id };
}

export function notFound(): never {
  error(404, 'Tidak ditemukan');
}
