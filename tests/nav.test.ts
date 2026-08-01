import { describe, expect, it } from 'vitest';
import { HOME, safeNext } from '$lib/nav';

/**
 * The auth callback is the only place in the app that redirects to a value
 * taken from a parameter, so this is the only place an open redirect could
 * live. Each refusal below is a real bypass shape, not a hypothetical.
 *
 * Every fallback asserts `HOME`, not a literal. `/` is the public landing page
 * now, and sending a Member who has just signed in to a page that pitches them
 * the app would be the wrong destination — the constant is what keeps the two
 * ideas apart.
 */
describe('safeNext', () => {
  it('honours an ordinary local path', () => {
    expect(safeNext('/transaksi')).toBe('/transaksi');
  });

  it('keeps the query string, so a link can land on a filtered screen', () => {
    expect(safeNext('/transaksi?f=pengeluaran&m=2026-06')).toBe('/transaksi?f=pengeluaran&m=2026-06');
  });

  it('refuses an absolute URL', () => {
    expect(safeNext('https://evil.example/steal')).toBe(HOME);
    expect(safeNext('http://evil.example')).toBe(HOME);
  });

  it('refuses a protocol-relative URL, which a browser treats as absolute', () => {
    expect(safeNext('//evil.example/steal')).toBe(HOME);
  });

  it('refuses the backslash form browsers normalise to protocol-relative', () => {
    expect(safeNext('/\\evil.example')).toBe(HOME);
    expect(safeNext('\\\\evil.example')).toBe(HOME);
  });

  it('refuses a bare host with no scheme', () => {
    expect(safeNext('evil.example')).toBe(HOME);
  });

  it('falls back when nothing was asked for', () => {
    expect(safeNext(null)).toBe(HOME);
    expect(safeNext(undefined)).toBe(HOME);
    expect(safeNext('')).toBe(HOME);
    expect(safeNext('   ')).toBe(HOME);
  });

  it('takes a caller-supplied fallback', () => {
    expect(safeNext('https://evil.example', '/masuk')).toBe('/masuk');
  });

  it('lands a signed-in Member inside the app, never on the landing page', () => {
    // Pinned deliberately: if HOME ever drifts back to '/', an OAuth round trip
    // would deposit a Member on the marketing page instead of their books.
    expect(HOME).toBe('/beranda');
    expect(HOME).not.toBe('/');
  });
});
