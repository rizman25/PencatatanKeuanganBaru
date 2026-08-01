/**
 * Profile photos (spec 0004). The bucket is private, so every rendered photo is
 * a signed URL minted here during `load` — never a stored URL.
 *
 * That has a useful side effect: because a fresh URL is minted on every render,
 * a photo that has just been replaced can never come back from a cache as the
 * old one. There is no cache-busting problem to solve because there is no
 * durable URL to cache.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

export const AVATAR_BUCKET = 'avatars';

/** An hour is far longer than a page view and far shorter than a leak. */
const EXPIRY_SECONDS = 60 * 60;

/**
 * One batched call for every photo a screen needs, so adding faces to a list
 * costs the same round trip as showing one.
 *
 * Paths that no longer resolve come back absent rather than throwing: a
 * dangling `avatar_url` should degrade to initials, not break the screen.
 */
export async function signAvatars(
  supabase: SupabaseClient,
  paths: (string | null | undefined)[]
): Promise<Map<string, string>> {
  const wanted = [...new Set(paths.filter((p): p is string => !!p))];
  const urls = new Map<string, string>();
  if (!wanted.length) return urls;

  const { data } = await supabase.storage
    .from(AVATAR_BUCKET)
    .createSignedUrls(wanted, EXPIRY_SECONDS);

  for (const row of data ?? []) {
    if (row.path && row.signedUrl) urls.set(row.path, row.signedUrl);
  }
  return urls;
}
