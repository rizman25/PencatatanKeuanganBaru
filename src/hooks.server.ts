import { createServerClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';
import type { Handle } from '@sveltejs/kit';

/**
 * The Supabase client lives only on the server (ADR-0006). The browser never
 * holds one; the session travels as an httpOnly cookie.
 */
export const handle: Handle = async ({ event, resolve }) => {
  event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => event.cookies.getAll(),
      setAll: (cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[]) => {
        for (const { name, value, options } of cookiesToSet) {
          event.cookies.set(name, value, { ...options, path: '/' });
        }
      }
    }
  });

  /**
   * getSession() alone trusts whatever is in the cookie. getUser() revalidates
   * against the auth server, so it is the only safe basis for an access decision.
   */
  event.locals.safeGetSession = async () => {
    const {
      data: { user },
      error
    } = await event.locals.supabase.auth.getUser();
    if (error || !user) return { session: null, user: null };

    const {
      data: { session }
    } = await event.locals.supabase.auth.getSession();
    return { session, user };
  };

  return resolve(event, {
    filterSerializedResponseHeaders: (name) =>
      name === 'content-range' || name === 'x-supabase-api-version'
  });
};
