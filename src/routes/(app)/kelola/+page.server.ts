import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { loadCategories, loadWallets } from '$lib/server/data';
import { requireHousehold } from '$lib/server/session';
import { signAvatars, AVATAR_BUCKET } from '$lib/server/avatars';
import { isoDate, rp } from '$lib/format';
import { resolveMonth } from '$lib/month';
import {
  avatarPath,
  balanceBreakdown,
  nameProblem,
  nameTaken,
  passwordProblem,
  resolveTab,
  spendBreakdown,
  uploadProblem,
  walletTag
} from '$lib/kelola';
import type { Transaction } from '$lib/types';

export const load: PageServerLoad = async ({ locals, url }) => {
  /**
   * Resolved here rather than taken from the layout. Kelola has no stepper and
   * is absent from the bottom nav, so letting `?m=` reach it would move a figure
   * with no control on screen to explain the move.
   */
  const month = resolveMonth(null, isoDate());

  /**
   * Membership and profiles are fetched separately rather than as an embedded
   * select. Two rows joined in TypeScript are cheaper to reason about than a
   * nested shape, and the join is trivial here.
   */
  const [wallets, categories, { data: members }, { data: profiles }, { data: spendTxs }] =
    await Promise.all([
      loadWallets(locals.supabase, { includeArchived: true }),
      loadCategories(locals.supabase, { includeArchived: true }),
      locals.supabase.from('household_members').select('user_id'),
      locals.supabase.from('profiles').select('id, display_name, avatar_url'),
      locals.supabase
        .from('transactions')
        .select('*')
        .eq('type', 'expense')
        .gte('occurred_on', month.start)
        .lte('occurred_on', month.end)
    ]);

  const { data: sessionUser } = await locals.supabase.auth.getUser();
  const me = sessionUser.user?.id;
  const rows = new Map((profiles ?? []).map((p) => [p.id, p]));

  /**
   * One batched call for every Member's photo. A dangling path resolves to
   * nothing and the Member falls back to initials, which is why the URL is
   * looked up rather than assumed present.
   */
  const photos = await signAvatars(
    locals.supabase,
    (members ?? []).map((m) => rows.get(m.user_id)?.avatar_url)
  );
  const photoOf = (id: string) => {
    const path = rows.get(id)?.avatar_url;
    return (path && photos.get(path)) ?? null;
  };

  return {
    tab: resolveTab(url.searchParams.get('tab')),
    wallets,
    categories,
    members: (members ?? []).map((m) => ({
      id: m.user_id,
      name: rows.get(m.user_id)?.display_name ?? 'Anggota',
      photo: photoOf(m.user_id),
      isMe: m.user_id === me
    })),
    profile: {
      name: me ? (rows.get(me)?.display_name ?? null) : null,
      photo: me ? photoOf(me) : null
    },
    /** Named beside the logout button, so it is obvious whose books these are. */
    account: sessionUser.user?.email ?? null,
    saldo: balanceBreakdown(wallets),
    spend: spendBreakdown((spendTxs ?? []) as Transaction[], wallets),
    spendMonth: month.label
  };
};

/** Every Wallet in the Household, archived included — see `namaDipakai` below. */
async function walletNames(event: Parameters<Actions[string]>[0]) {
  const { data } = await event.locals.supabase.from('wallets').select('id, name');
  return data ?? [];
}

export const actions: Actions = {
  tambahDompet: async (event) => {
    const { householdId, userId } = await requireHousehold(event);
    const form = await event.request.formData();
    const name = String(form.get('name') ?? '').trim();
    const initial = Number(form.get('initial_balance') ?? 0);
    const type = String(form.get('type') ?? 'cash');

    if (!name) return fail(400, { message: 'Beri nama dompet.' });
    if (nameTaken(await walletNames(event), name)) {
      return fail(400, { message: `Sudah ada dompet bernama “${name}”.` });
    }

    const { error } = await event.locals.supabase.from('wallets').insert({
      household_id: householdId,
      name,
      tag: walletTag(name),
      type,
      initial_balance: Number.isFinite(initial) ? initial : 0,
      created_by: userId
    });
    if (error) return fail(400, { message: error.message });
  },

  /**
   * Name only. Saldo Awal is the only balance figure stored anywhere, so
   * editing it would rewrite every historical Saldo with no Transaction to
   * account for the change; Jenis is equally load-bearing and equally absent.
   *
   * Renaming is safe because everything points at ids — Transactions at
   * `wallet_id`, and nothing at the name.
   */
  ubahDompet: async (event) => {
    await requireHousehold(event);
    const form = await event.request.formData();
    const id = String(form.get('id'));
    const name = String(form.get('name') ?? '').trim();

    if (!name) return fail(400, { message: 'Beri nama dompet.' });
    if (nameTaken(await walletNames(event), name, id)) {
      return fail(400, { message: `Sudah ada dompet bernama “${name}”.` });
    }

    // The tile code was derived at creation and was never typed, so it follows
    // the rename rather than being left to contradict the label beside it.
    const { error } = await event.locals.supabase
      .from('wallets')
      .update({ name, tag: walletTag(name) })
      .eq('id', id);
    if (error) return fail(400, { message: error.message });
  },

  // Archive, never destroy (ADR-0008) — the toggle restores as well.
  arsipDompet: async (event) => {
    await requireHousehold(event);
    const form = await event.request.formData();
    const id = String(form.get('id'));
    const archived = String(form.get('archived')) === 'true';

    /**
     * Archived wallets are excluded from every total, so archiving one that
     * still holds money would quietly shrink the household's saldo with
     * nothing on screen to explain it. Empty it first — the money has to go
     * somewhere real, which is a transfer.
     */
    if (!archived) {
      const { data: bal } = await event.locals.supabase
        .from('wallet_balances')
        .select('balance')
        .eq('wallet_id', id)
        .maybeSingle();

      const balance = Number(bal?.balance ?? 0);
      if (balance !== 0) {
        return fail(400, {
          message:
            'Dompet ini masih bersaldo ' +
            rp(balance) +
            '. Pindahkan dulu isinya lewat Transfer, baru bisa diarsipkan.'
        });
      }
    }

    await event.locals.supabase
      .from('wallets')
      .update({ archived_at: archived ? null : new Date().toISOString() })
      .eq('id', id);
  },

  tambahKategori: async (event) => {
    const { householdId } = await requireHousehold(event);
    const form = await event.request.formData();
    const name = String(form.get('name') ?? '').trim();
    const kind = String(form.get('kind') ?? 'expense');

    if (!name) return fail(400, { message: 'Beri nama kategori.' });

    const { data: siblings } = await event.locals.supabase
      .from('categories')
      .select('id, name')
      .eq('kind', kind);

    if (nameTaken(siblings ?? [], name)) {
      return fail(400, { message: sudahAda(kind, name) });
    }

    const { error } = await event.locals.supabase
      .from('categories')
      .insert({ household_id: householdId, name, kind });
    if (error) return fail(400, { message: error.message });
  },

  /**
   * Name only, and deliberately not `kind`. There is no database constraint
   * tying a Category's kind to a Transaction's type, so flipping one would
   * leave Expense rows pointing at an income Category and Postgres would raise
   * nothing. Budgets and the Anggaran drill-down key off the id, so they follow
   * a rename by themselves.
   */
  ubahKategori: async (event) => {
    await requireHousehold(event);
    const form = await event.request.formData();
    const id = String(form.get('id'));
    const name = String(form.get('name') ?? '').trim();

    if (!name) return fail(400, { message: 'Beri nama kategori.' });

    // The kind is read from the row, not from the form: it decides which names
    // count as taken, and nothing client-supplied should decide that.
    const { data: row } = await event.locals.supabase
      .from('categories')
      .select('id, kind')
      .eq('id', id)
      .maybeSingle();

    if (!row) return fail(400, { message: 'Kategori tidak ditemukan.' });

    const { data: siblings } = await event.locals.supabase
      .from('categories')
      .select('id, name')
      .eq('kind', row.kind);

    if (nameTaken(siblings ?? [], name, id)) {
      return fail(400, { message: sudahAda(row.kind, name) });
    }

    const { error } = await event.locals.supabase
      .from('categories')
      .update({ name })
      .eq('id', id);
    if (error) return fail(400, { message: error.message });
  },

  arsipKategori: async (event) => {
    await requireHousehold(event);
    const form = await event.request.formData();
    const id = String(form.get('id'));
    const archived = String(form.get('archived')) === 'true';

    await event.locals.supabase
      .from('categories')
      .update({ archived_at: archived ? null : new Date().toISOString() })
      .eq('id', id);
  },

  kodeBaru: async (event) => {
    const { householdId } = await requireHousehold(event);
    await event.locals.supabase.rpc('regenerate_invite_code', { p_household: householdId });
  },

  /* ---------------------------------------------------------------- profile */
  /*
   * Every action below reports its `section`, so a rejected password cannot
   * put an error message above an unrelated form. Each section is its own form
   * for the same reason: one failing must not discard what another holds.
   */

  /**
   * The display name attached to every Transaction this Member records. It has
   * been unchangeable since the app was built — written once by the signup
   * trigger from Google metadata or the local part of an email address.
   *
   * Nothing stores a name alongside a Transaction, so a rename reaches the
   * whole history by itself. That is correct: attribution is to a person, not
   * to whatever they were called that day.
   */
  ubahNama: async (event) => {
    const { userId } = await requireHousehold(event);
    const form = await event.request.formData();
    const name = String(form.get('name') ?? '').trim();

    const problem = nameProblem(name, 'nama');
    if (problem) return fail(400, { section: 'nama', message: problem });

    const { error } = await event.locals.supabase
      .from('profiles')
      .update({ display_name: name })
      .eq('id', userId);
    if (error) return fail(400, { section: 'nama', message: error.message });
  },

  /**
   * The browser shrinks the image to a 256px square before it gets here, so a
   * normal upload is around 30 KB. The checks below are still made server-side
   * and independently: a client that skips the resize is rejected, not
   * accommodated.
   */
  ubahFoto: async (event) => {
    const { userId } = await requireHousehold(event);
    const form = await event.request.formData();
    const file = form.get('photo');

    if (!(file instanceof File)) {
      return fail(400, { section: 'foto', message: 'Pilih foto dulu.' });
    }

    const problem = uploadProblem(file.type, file.size);
    if (problem) return fail(400, { section: 'foto', message: problem });

    const { data: before } = await event.locals.supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', userId)
      .maybeSingle();

    const path = avatarPath(userId, crypto.randomUUID(), file.type);
    const { error: upErr } = await event.locals.supabase.storage
      .from(AVATAR_BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false });
    if (upErr) return fail(400, { section: 'foto', message: upErr.message });

    const { error } = await event.locals.supabase
      .from('profiles')
      .update({ avatar_url: path })
      .eq('id', userId);

    if (error) {
      // The row still points at the old photo, so the new object is orphaned.
      // Clear it rather than leave a file nothing will ever name.
      await event.locals.supabase.storage.from(AVATAR_BUCKET).remove([path]);
      return fail(400, { section: 'foto', message: error.message });
    }

    // Only once the row points somewhere else (see ADR-0008 carve-out in the
    // migration): a superseded avatar has no history to protect.
    if (before?.avatar_url) {
      await event.locals.supabase.storage.from(AVATAR_BUCKET).remove([before.avatar_url]);
    }
  },

  hapusFoto: async (event) => {
    const { userId } = await requireHousehold(event);

    const { data: before } = await event.locals.supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', userId)
      .maybeSingle();

    const { error } = await event.locals.supabase
      .from('profiles')
      .update({ avatar_url: null })
      .eq('id', userId);
    if (error) return fail(400, { section: 'foto', message: error.message });

    if (before?.avatar_url) {
      await event.locals.supabase.storage.from(AVATAR_BUCKET).remove([before.avatar_url]);
    }
  },

  /**
   * The current password is required, and verified by signing in with it before
   * anything changes. Supabase offers no way to check a password without
   * signing in, so this is the mechanism available — and it signs in the same
   * account that is already signed in, so the session it returns is the session
   * that was already there.
   *
   * Without this check, anyone holding an unlocked phone could lock the Member
   * out of their own books.
   */
  ubahSandi: async (event) => {
    await requireHousehold(event);
    const form = await event.request.formData();
    const current = String(form.get('current') ?? '');
    const next = String(form.get('next') ?? '');
    const confirm = String(form.get('confirm') ?? '');

    const problem = passwordProblem(current, next, confirm);
    if (problem) return fail(400, { section: 'sandi', message: problem });

    const { data: sessionUser } = await event.locals.supabase.auth.getUser();
    const email = sessionUser.user?.email;
    if (!email) {
      return fail(400, { section: 'sandi', message: 'Akun ini tidak memakai sandi.' });
    }

    const { error: wrong } = await event.locals.supabase.auth.signInWithPassword({
      email,
      password: current
    });
    if (wrong) return fail(400, { section: 'sandi', message: 'Sandi saat ini salah.' });

    const { error } = await event.locals.supabase.auth.updateUser({ password: next });
    if (error) return fail(400, { section: 'sandi', message: error.message });

    return { section: 'sandi', ok: 'Sandi berhasil diubah.' };
  },

  /** Printed in the Beranda header every day, so a typo there is worth fixing. */
  ubahRumah: async (event) => {
    const { householdId } = await requireHousehold(event);
    const form = await event.request.formData();
    const name = String(form.get('name') ?? '').trim();

    const problem = nameProblem(name, 'nama rumah tangga');
    if (problem) return fail(400, { section: 'rumah', message: problem });

    const { error } = await event.locals.supabase
      .from('households')
      .update({ name })
      .eq('id', householdId);
    if (error) return fail(400, { section: 'rumah', message: error.message });
  }
};

/** Names the kind, so a name that looks free is explained rather than refused. */
function sudahAda(kind: string, name: string) {
  const label = kind === 'income' ? 'pemasukan' : 'pengeluaran';
  return `Sudah ada kategori ${label} bernama “${name}”.`;
}
