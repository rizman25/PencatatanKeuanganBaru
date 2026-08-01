/**
 * Kelola's pure logic (spec 0003): the two Dompet breakdowns and the name
 * uniqueness rule.
 *
 * The uniqueness rule lives here rather than inside the form actions because
 * writes have no test seam — the fake Supabase client implements reads only.
 * Extracting the decidable part is the same move already made for the Debt
 * filters and the Debt return path.
 */
import { LAINNYA, MAX_SLICES, rollUp, type Slice } from '$lib/chart';
import type { Transaction } from '$lib/types';

export interface WalletLike {
  id: string;
  name: string;
  balance: number;
  archived_at?: string | null;
}

export interface Breakdown {
  /** Ranked, positive-only, keyed by Wallet id so slices can link. */
  slices: Slice[];
  /**
   * Wallets the arc cannot represent. A negative Saldo is not an angle, and
   * hiding one would hide what is almost always a data-entry error.
   */
  excluded: { id: string; name: string; amount: number }[];
  /** The true figure for the centre, negatives included. */
  total: number;
}

const EMPTY: Breakdown = { slices: [], excluded: [], total: 0 };

/** Where the Household's money sits right now, across active Wallets. */
export function balanceBreakdown(wallets: WalletLike[]): Breakdown {
  const active = wallets.filter((w) => !w.archived_at);
  if (!active.length) return EMPTY;

  const totals = new Map<string, number>();
  const keys = new Map<string, string>();
  const excluded: Breakdown['excluded'] = [];

  for (const w of active) {
    if (w.balance < 0) {
      excluded.push({ id: w.id, name: w.name, amount: w.balance });
      continue;
    }
    // A Wallet sitting at exactly zero contributes no arc and no legend row.
    // It is still listed in full directly below the chart.
    if (w.balance === 0) continue;

    totals.set(w.name, (totals.get(w.name) ?? 0) + w.balance);
    keys.set(w.name, w.id);
  }

  return {
    slices: rollUp(totals, MAX_SLICES, keys),
    excluded,
    total: active.reduce((a, w) => a + w.balance, 0)
  };
}

/**
 * Which Wallet the month's spending left. Every Expense contributes to exactly
 * one slice — cicilan included — so the chart totals the month's Pengeluaran
 * exactly. Transfers move money inside the Household and are not spending.
 */
export function spendBreakdown(transactions: Transaction[], wallets: WalletLike[]): Breakdown {
  const names = new Map(wallets.map((w) => [w.id, w.name]));
  const totals = new Map<string, number>();
  const keys = new Map<string, string>();
  let total = 0;

  for (const t of transactions) {
    if (t.type !== 'expense') continue;

    const name = names.get(t.wallet_id);
    const label = name ?? LAINNYA;
    totals.set(label, (totals.get(label) ?? 0) + t.amount);
    if (name) keys.set(label, t.wallet_id);
    total += t.amount;
  }

  return { slices: rollUp(totals, MAX_SLICES, keys), excluded: [], total };
}

/**
 * Whether `candidate` is already in use by a row other than `selfId`.
 *
 * Case- and whitespace-insensitive, so "bca" collides with "BCA ". Saving a row
 * under its own current name is not a collision, which is what lets the edit
 * form be opened and submitted unchanged.
 *
 * An empty candidate is never "taken" — that is a separate, earlier failure with
 * its own message.
 *
 * Scope is the caller's job: Wallets pass every Wallet in the Household, and
 * Categories pass only those of the same kind.
 */
export function nameTaken(
  existing: { id: string; name: string }[],
  candidate: string,
  selfId?: string | null
): boolean {
  const want = candidate.trim().toLowerCase();
  if (!want) return false;
  return existing.some((r) => r.id !== selfId && r.name.trim().toLowerCase() === want);
}

/** The tile code shown beside a Wallet — derived from the name, never typed. */
export function walletTag(name: string): string {
  return name.trim().slice(0, 3).toUpperCase();
}

/* ------------------------------------------------------------------ profile */
/*
 * Spec 0004. The decidable parts of the Profile tab live here for the same
 * reason the name rule above does: the form actions that use them have no test
 * seam, so what can be decided without Supabase is decided in a pure function
 * and tested directly.
 */

export const TABS = ['dompet', 'kategori', 'profil'] as const;
export type Tab = (typeof TABS)[number];

/**
 * Which tab `?tab=` selects. Anything unrecognised opens Dompet rather than
 * erroring — a stale or mistyped link should show the screen, not a 404. Same
 * treatment `?m=` and `?w=` already get.
 */
export function resolveTab(param: string | null | undefined): Tab {
  return TABS.includes(param as Tab) ? (param as Tab) : 'dompet';
}

/** Longest name the screens that print one can hold without wrapping badly. */
export const MAX_NAME = 40;

/**
 * Why a name cannot be saved, in Bahasa Indonesia, or null when it can.
 *
 * Deliberately no uniqueness check, unlike Wallets and Categories: two
 * Categories sharing a name genuinely merges two things in the pie chart, while
 * two Members sharing one merely reads oddly. The app should not refuse a real
 * person's real name to prevent something cosmetic.
 */
export function nameProblem(candidate: string, what: string): string | null {
  const name = candidate.trim();
  if (!name) return `Beri ${what}.`;
  if (name.length > MAX_NAME) return `${what} maksimal ${MAX_NAME} karakter.`;
  return null;
}

/** Up to two letters, so two Members rarely collide behind the same circle. */
export function initials(name: string | null | undefined): string {
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '?';
  if (words.length === 1) return words[0].charAt(0).toUpperCase();
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
}

/** The side of the square the avatar is rendered and stored at. */
export const AVATAR_PX = 256;

/**
 * The centre square of a source image, as source-pixel coordinates.
 *
 * Centre-crop only: a drag-to-position cropper is a real interaction to build,
 * and the photo is rendered at 34px in the place that matters most.
 */
export function cropBox(width: number, height: number) {
  const size = Math.min(width, height);
  return { x: Math.round((width - size) / 2), y: Math.round((height - size) / 2), size };
}

/**
 * What the server accepts. The browser shrinks a photo to roughly 30 KB before
 * it is sent, so this cap is far above anything the app itself produces and far
 * below an untouched phone photo: a client that skips the resize is rejected,
 * not accommodated.
 */
export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
const TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp'
};

export function uploadProblem(type: string, size: number): string | null {
  if (!TYPES[type]) return 'Pilih berkas gambar (JPG, PNG, atau WEBP).';
  if (size <= 0) return 'Berkas kosong.';
  if (size > MAX_UPLOAD_BYTES) return 'Ukuran foto maksimal 2 MB.';
  return null;
}

/**
 * Where a new photo is stored. The owner is the first segment — that is the
 * whole basis of the storage policies — and the second is random, so a path is
 * never guessable from a user id and a replacement never collides with what it
 * replaces. The token is passed in rather than generated here so the shape can
 * be asserted.
 */
export function avatarPath(userId: string, token: string, type: string): string {
  return `${userId}/${token}.${TYPES[type] ?? 'jpg'}`;
}

/** Matches the minimum signup already enforces, so the rule cannot differ by screen. */
export const MIN_PASSWORD = 8;

/** Why a password change cannot be attempted, or null when it can. */
export function passwordProblem(current: string, next: string, confirm: string): string | null {
  if (!current) return 'Masukkan sandi saat ini.';
  if (next.length < MIN_PASSWORD) return `Sandi baru minimal ${MIN_PASSWORD} karakter.`;
  if (next !== confirm) return 'Sandi baru dan konfirmasinya tidak sama.';
  if (next === current) return 'Sandi baru sama dengan yang lama.';
  return null;
}
