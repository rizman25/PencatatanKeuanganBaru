import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { resolveMonth } from '$lib/month';
import { isoDate } from '$lib/format';

/** Every authenticated screen needs a session and a household. Guard both here once. */
export const load: LayoutServerLoad = async ({ locals, url }) => {
  const { session, user } = await locals.safeGetSession();
  if (!session || !user) redirect(303, '/masuk');

  const { data: membership } = await locals.supabase
    .from('household_members')
    .select('household_id, households(id, name, invite_code)')
    .limit(1)
    .maybeSingle();

  if (!membership?.households) redirect(303, '/mulai');

  return {
    user,
    household: membership.households as unknown as {
      id: string;
      name: string;
      invite_code: string;
    },
    /**
     * Resolved once here so the screens and the bottom navigation cannot
     * disagree about which month is selected, and so `?m=` is sanitised in one
     * place rather than at every point that reads it.
     */
    month: resolveMonth(url.searchParams.get('m'), isoDate())
  };
};
