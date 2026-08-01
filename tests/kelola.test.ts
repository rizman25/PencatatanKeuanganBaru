import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { load as loadKelola } from '../src/routes/(app)/kelola/+page.server';
import { fakeSupabase } from './fake-supabase';
import { AVATAR, fixture, IDS, TODAY } from './fixtures';
import {
  avatarPath,
  balanceBreakdown,
  cropBox,
  initials,
  nameProblem,
  nameTaken,
  passwordProblem,
  resolveTab,
  spendBreakdown,
  uploadProblem,
  walletTag
} from '$lib/kelola';

/**
 * Kelola has no month stepper, so its Pengeluaran chart resolves the month from
 * the system clock rather than from `?m=` (spec 0003). That is the one place a
 * load reaches past the fixture to the real calendar — so the clock is pinned
 * here, to the same day the fixture is written around.
 *
 * Without this the spending assertions below pass only during July 2026, which
 * is exactly the drift the fixture header promises does not happen. Only `Date`
 * is faked; timers are left alone so the load's promises resolve normally.
 */
beforeAll(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(`${TODAY}T12:00:00`));
});
afterAll(() => vi.useRealTimers());

const kelola = (overrides = {}, query = '') =>
  (loadKelola as any)({
    locals: { supabase: fakeSupabase(fixture(overrides)) },
    url: new URL(`http://x/kelola${query}`)
  });

describe('Kelola · balance composition', () => {
  it('ranks the wallets by size and shares them out of the drawn total', async () => {
    const { saldo } = await kelola();

    expect(saldo.slices.map((s: any) => s.name)).toEqual(['Tabungan', 'BCA', 'Tunai', 'GoPay']);
    expect(saldo.slices.reduce((a: number, s: any) => a + s.share, 0)).toBeCloseTo(1);
  });

  it('leaves archived wallets out, so the chart matches the list beside it', async () => {
    const { saldo } = await kelola();
    expect(saldo.slices.map((s: any) => s.name)).not.toContain('Dompet Lama');
  });

  it('totals what the Dompet list totals', async () => {
    const { saldo } = await kelola();
    // 1.25 + 9 + 0.8 + 14 juta across the four active wallets.
    expect(saldo.total).toBe(25_050_000);
    expect(saldo.slices.reduce((a: number, s: any) => a + s.amount, 0)).toBe(25_050_000);
  });

  it('keys each slice to its wallet, so a slice can lead somewhere', async () => {
    const { saldo } = await kelola();
    const bca = saldo.slices.find((s: any) => s.name === 'BCA');
    expect(bca.key).toBe('w-bca');
  });

  it('keeps a negative wallet out of the arc but names it in full', () => {
    const { slices, excluded, total } = balanceBreakdown([
      { id: 'w-a', name: 'BCA', balance: 8_000_000, archived_at: null },
      { id: 'w-b', name: 'Kartu', balance: -150_000, archived_at: null }
    ]);

    expect(slices.map((s: any) => s.name)).toEqual(['BCA']);
    expect(excluded).toEqual([{ id: 'w-b', name: 'Kartu', amount: -150_000 }]);
    // The centre figure stays the true total, so it still agrees with the list.
    expect(total).toBe(7_850_000);
  });

  it('draws nothing at all when every wallet is empty', () => {
    const { slices, total } = balanceBreakdown([
      { id: 'w-a', name: 'Tunai', balance: 0, archived_at: null }
    ]);
    expect(slices).toEqual([]);
    expect(total).toBe(0);
  });
});

describe('Kelola · spending composition', () => {
  it('splits the month by the wallet the money left', async () => {
    const { spend } = await kelola();
    const byName = Object.fromEntries(spend.slices.map((s: any) => [s.name, s.amount]));

    // July: BCA 285 + 680 + 1000 + 500, Tunai 1850, GoPay 145 + 430.
    expect(byName).toEqual({ BCA: 2_465_000, Tunai: 1_850_000, GoPay: 575_000 });
  });

  it('counts cicilan, so the chart totals the month Pengeluaran exactly', async () => {
    const { spend } = await kelola();
    const drawn = spend.slices.reduce((a: number, s: any) => a + s.amount, 0);

    expect(spend.total).toBe(4_890_000);
    expect(drawn).toBe(spend.total);
  });

  it('ignores transfers, which move money without spending it', () => {
    const { slices, total } = spendBreakdown(
      [
        {
          id: 't-1', type: 'transfer', amount: 2_000_000, wallet_id: 'w-bca',
          to_wallet_id: 'w-tab', category_id: null, debt_id: null, role: null,
          occurred_on: '2026-07-12', note: null, created_by: 'u'
        }
      ],
      [{ id: 'w-bca', name: 'BCA', balance: 0 }]
    );

    expect(slices).toEqual([]);
    expect(total).toBe(0);
  });

  it('reports an empty month as empty rather than as a zero ring', async () => {
    const { spend } = await kelola({ transactions: [] });
    expect(spend.slices).toEqual([]);
    expect(spend.total).toBe(0);
  });
});

describe('Kelola · name uniqueness', () => {
  const rows = [
    { id: 'a', name: 'BCA' },
    { id: 'b', name: 'Tunai' }
  ];

  it('refuses a name another row already holds', () => {
    expect(nameTaken(rows, 'Tunai')).toBe(true);
  });

  it('ignores capitalisation and surrounding space', () => {
    expect(nameTaken(rows, '  bca ')).toBe(true);
  });

  it('lets a row keep its own name, so saving unchanged is not an error', () => {
    expect(nameTaken(rows, 'BCA', 'a')).toBe(false);
  });

  it('still refuses another row name when editing', () => {
    expect(nameTaken(rows, 'Tunai', 'a')).toBe(true);
  });

  it('treats an empty candidate as a different failure, not a collision', () => {
    expect(nameTaken(rows, '   ')).toBe(false);
  });

  it('allows a free name', () => {
    expect(nameTaken(rows, 'GoPay')).toBe(false);
  });

  it('scopes categories by kind, so one name can be both income and expense', async () => {
    const { categories } = await kelola();
    const income = categories.filter((c: any) => c.kind === 'income');
    const expense = categories.filter((c: any) => c.kind === 'expense');

    // "Bonus" is an income Category in the fixture and free among expenses.
    expect(nameTaken(income, 'Bonus')).toBe(true);
    expect(nameTaken(expense, 'Bonus')).toBe(false);
  });
});

describe('Kelola · wallet tag', () => {
  it('follows the name, so the tile cannot contradict the label', () => {
    expect(walletTag('Mandiri')).toBe('MAN');
    expect(walletTag('  bca ')).toBe('BCA');
  });
});

describe('Kelola · account', () => {
  it('names the signed-in account for the logout footer', async () => {
    const data = await kelola();
    expect(data.account).toBe('rizman@example.com');
  });
});

describe('Kelola · the tab in the URL', () => {
  it('opens Dompet when nothing is asked for', async () => {
    expect((await kelola()).tab).toBe('dompet');
  });

  it('opens the tab the link names', async () => {
    expect((await kelola({}, '?tab=profil')).tab).toBe('profil');
    expect((await kelola({}, '?tab=kategori')).tab).toBe('kategori');
  });

  it('falls back to Dompet for a tab that does not exist', async () => {
    // A stale or mistyped link should show the screen, not an error.
    expect((await kelola({}, '?tab=zzz')).tab).toBe('dompet');
  });

  it('resolves without a load at all', () => {
    expect(resolveTab(null)).toBe('dompet');
    expect(resolveTab('profil')).toBe('profil');
    expect(resolveTab('')).toBe('dompet');
  });
});

describe('Kelola · profile', () => {
  it('carries the signed-in Member own name and photo', async () => {
    const { profile } = await kelola();
    expect(profile.name).toBe('Rizman Luqman');
    expect(profile.photo).toBe(`signed:avatars/${AVATAR}?exp=3600`);
  });

  it('signs the photo of a Member who has one', async () => {
    const { members } = await kelola();
    const me = members.find((m: any) => m.id === IDS.ME);
    expect(me.photo).toBe(`signed:avatars/${AVATAR}?exp=3600`);
    expect(me.isMe).toBe(true);
  });

  it('leaves a Member without a photo with none, so initials can stand in', async () => {
    const { members } = await kelola();
    const partner = members.find((m: any) => m.id === IDS.PARTNER);
    expect(partner.name).toBe('Sari');
    expect(partner.photo).toBeNull();
  });

  it('degrades to no photo when the stored path no longer resolves', async () => {
    // A dangling avatar_url must fall back to initials rather than break Kelola.
    const { members, profile } = await kelola({
      profiles: [
        { id: IDS.ME, display_name: 'Rizman Luqman', avatar_url: 'user-rizman/gone.jpg' },
        { id: IDS.PARTNER, display_name: 'Sari', avatar_url: null }
      ]
    });
    expect(profile.photo).toBeNull();
    expect(members.find((m: any) => m.id === IDS.ME).photo).toBeNull();
  });

  it('asks storage for nothing when nobody has a photo', async () => {
    /**
     * The bucket is removed rather than emptied, so any storage call at all
     * throws by name. That is what makes this an assertion about the skip and
     * not just about the two nulls below, which would be true either way.
     */
    const noBucket = {
      ...fixture({
        profiles: [
          { id: IDS.ME, display_name: 'Rizman Luqman', avatar_url: null },
          { id: IDS.PARTNER, display_name: 'Sari', avatar_url: null }
        ]
      }),
      buckets: {}
    };

    const data = await (loadKelola as any)({
      locals: { supabase: fakeSupabase(noBucket) },
      url: new URL('http://x/kelola')
    });

    expect(data.profile.photo).toBeNull();
    expect(data.members.every((m: any) => m.photo === null)).toBe(true);
  });
});

describe('Kelola · initials', () => {
  it('takes the first and last word, so two Members rarely collide', () => {
    expect(initials('Rizman Luqman')).toBe('RL');
    expect(initials('Ahmad Rizal Luqman')).toBe('AL');
  });

  it('takes one letter from a single-word name', () => {
    expect(initials('Sari')).toBe('S');
  });

  it('survives extra whitespace', () => {
    expect(initials('  rizman   luqman  ')).toBe('RL');
  });

  it('shows a placeholder rather than nothing when there is no name', () => {
    expect(initials('')).toBe('?');
    expect(initials(null)).toBe('?');
    expect(initials('   ')).toBe('?');
  });
});

describe('Kelola · photo handling', () => {
  it('keeps the centre square of a landscape photo', () => {
    expect(cropBox(1000, 600)).toEqual({ x: 200, y: 0, size: 600 });
  });

  it('keeps the centre square of a portrait photo', () => {
    expect(cropBox(600, 1000)).toEqual({ x: 0, y: 200, size: 600 });
  });

  it('leaves an already-square photo alone', () => {
    expect(cropBox(800, 800)).toEqual({ x: 0, y: 0, size: 800 });
  });

  it('refuses a file that is not an image', () => {
    expect(uploadProblem('application/pdf', 1000)).toMatch(/gambar/i);
  });

  it('refuses a file too large to be a resized avatar', () => {
    expect(uploadProblem('image/jpeg', 9_000_000)).toMatch(/2 MB/);
  });

  it('accepts what the browser resize actually produces', () => {
    expect(uploadProblem('image/jpeg', 30_000)).toBeNull();
    expect(uploadProblem('image/png', 30_000)).toBeNull();
    expect(uploadProblem('image/webp', 30_000)).toBeNull();
  });

  it('puts the owner first in the path, which is what the policy keys on', () => {
    expect(avatarPath('user-rizman', 'tok', 'image/jpeg')).toBe('user-rizman/tok.jpg');
    expect(avatarPath('user-rizman', 'tok', 'image/png')).toBe('user-rizman/tok.png');
  });
});

describe('Kelola · name and password rules', () => {
  it('refuses an empty name, naming what is missing', () => {
    expect(nameProblem('   ', 'nama')).toBe('Beri nama.');
  });

  it('refuses a name too long for the screens that print it', () => {
    expect(nameProblem('x'.repeat(41), 'nama')).toMatch(/maksimal/);
  });

  it('accepts an ordinary name', () => {
    expect(nameProblem('  Rizman Luqman ', 'nama')).toBeNull();
  });

  it('requires the current password before anything else', () => {
    expect(passwordProblem('', 'panjangsekali', 'panjangsekali')).toMatch(/saat ini/);
  });

  it('enforces the same minimum length signup does', () => {
    expect(passwordProblem('lama1234', 'pendek', 'pendek')).toMatch(/8 karakter/);
  });

  it('catches a mistyped confirmation before anything is sent', () => {
    expect(passwordProblem('lama1234', 'barubaru1', 'barubaru2')).toMatch(/tidak sama/);
  });

  it('refuses a new password identical to the old one', () => {
    expect(passwordProblem('lama1234', 'lama1234', 'lama1234')).toMatch(/sama dengan/);
  });

  it('passes a well-formed change', () => {
    expect(passwordProblem('lama1234', 'barubaru1', 'barubaru1')).toBeNull();
  });
});
