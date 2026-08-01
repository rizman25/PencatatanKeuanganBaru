/**
 * Redirect-target safety.
 *
 * Everywhere else in this app a return path is *derived* rather than carried —
 * see `debtReturnPath` and the Catat save redirect — precisely so there is no
 * parameter to validate. The auth callback is the one place that cannot do
 * that: `next` arrives from outside, across an OAuth round trip or an emailed
 * link, so it has to be checked instead.
 */

/**
 * Where a signed-in Member belongs. `/` is the public landing page, so this is
 * the fallback for every redirect that used to say `/` — landing a Member who
 * has just signed in on a page selling them the app would be absurd.
 */
export const HOME = '/beranda';

/**
 * The path to send someone to after signing in, or the fallback when the
 * requested one is not a local path.
 *
 * Only same-origin paths are honoured. An absolute URL, a protocol-relative
 * `//host`, or the `/\host` form that browsers normalise to the same thing are
 * all refused. A bad value here is far likelier to be an attack than a typo —
 * an open redirect on a login callback is what makes a phishing link look
 * genuine right up until it lands — so the response is to ignore it quietly
 * rather than to error and tell the attacker what was detected.
 */
export function safeNext(param: string | null | undefined, fallback: string = HOME): string {
  const next = (param ?? '').trim();
  if (!next.startsWith('/')) return fallback;
  if (next.startsWith('//') || next.startsWith('/\\')) return fallback;
  return next;
}
