/**
 * The one piece of test infrastructure in this repo (spec 0001).
 *
 * It implements exactly the slice of the Supabase query builder the `load`
 * functions use, and no more. That is the point: a load that starts calling a
 * method not implemented here throws by name rather than quietly returning
 * every row, so the fake cannot drift into lying about what the app does.
 *
 * Writes are absent entirely — the seam is reads.
 */

type Row = Record<string, any>;

export interface FakeData {
  /** Table or view name -> rows, exactly as Postgres would return them. */
  tables: Record<string, Row[]>;
  /** Postgres function name -> a function of its named arguments. */
  rpc?: Record<string, (args: Row) => Row[]>;
  /** Storage bucket name -> the object paths it holds. */
  buckets?: Record<string, string[]>;
  user?: { id: string; email?: string };
}

class Query implements PromiseLike<{ data: Row[] | null; error: null }> {
  #rows: Row[];
  #columns: string[] | null = null;
  #sorts: { col: string; ascending: boolean }[] = [];
  #limit: number | null = null;

  constructor(rows: Row[]) {
    this.#rows = [...rows];
  }

  select(columns = '*') {
    if (columns.includes('(')) {
      throw new Error(
        `fake-supabase: embedded selects are not supported ("${columns}"). ` +
          'Load the related table separately and join in TypeScript.'
      );
    }
    this.#columns =
      columns.trim() === '*' ? null : columns.split(',').map((c) => c.trim()).filter(Boolean);
    return this;
  }

  eq(col: string, value: unknown) {
    this.#rows = this.#rows.filter((r) => r[col] === value);
    return this;
  }

  neq(col: string, value: unknown) {
    this.#rows = this.#rows.filter((r) => r[col] !== value);
    return this;
  }

  gte(col: string, value: any) {
    this.#rows = this.#rows.filter((r) => r[col] >= value);
    return this;
  }

  lte(col: string, value: any) {
    this.#rows = this.#rows.filter((r) => r[col] <= value);
    return this;
  }

  /** Only `.is(col, null)` is used by the app, so only null is accepted. */
  is(col: string, value: null) {
    if (value !== null) throw new Error('fake-supabase: .is() only supports null');
    this.#rows = this.#rows.filter((r) => r[col] === null || r[col] === undefined);
    return this;
  }

  in(col: string, values: unknown[]) {
    this.#rows = this.#rows.filter((r) => values.includes(r[col]));
    return this;
  }

  /**
   * Only the shape the app actually uses: comma-separated `col.eq.value` terms,
   * as the Wallet filter needs to match either side of a Transfer. Anything
   * richer throws rather than being approximated, so the fake cannot pass while
   * the real query does something else.
   */
  or(filters: string) {
    const terms = filters.split(',').map((term) => {
      const [col, op, ...rest] = term.split('.');
      if (op !== 'eq' || !col || !rest.length) {
        throw new Error(
          `fake-supabase: .or() supports only "col.eq.value" terms, got "${term}".`
        );
      }
      return { col, value: rest.join('.') };
    });

    this.#rows = this.#rows.filter((r) => terms.some((t) => String(r[t.col]) === t.value));
    return this;
  }

  /** Sorts compose in call order, first call being the primary key. */
  order(col: string, opts: { ascending?: boolean } = {}) {
    this.#sorts.push({ col, ascending: opts.ascending !== false });
    return this;
  }

  limit(n: number) {
    this.#limit = n;
    return this;
  }

  async maybeSingle() {
    const rows = this.#resolve();
    return { data: rows[0] ?? null, error: null };
  }

  async single() {
    const rows = this.#resolve();
    if (rows.length !== 1) return { data: null, error: { message: 'no rows' } };
    return { data: rows[0], error: null };
  }

  #resolve(): Row[] {
    let rows = [...this.#rows];

    for (const { col, ascending } of [...this.#sorts].reverse()) {
      rows.sort((a, b) => {
        const x = a[col];
        const y = b[col];
        // Postgres sorts NULLs last on ASC by default; the app only relies on
        // this for due_date, where nullsFirst:false says the same thing.
        if (x == null && y == null) return 0;
        if (x == null) return 1;
        if (y == null) return -1;
        if (x === y) return 0;
        return (x < y ? -1 : 1) * (ascending ? 1 : -1);
      });
    }

    if (this.#limit !== null) rows = rows.slice(0, this.#limit);

    if (this.#columns) {
      const cols = this.#columns;
      rows = rows.map((r) => Object.fromEntries(cols.map((c) => [c, r[c]])));
    }

    return rows;
  }

  then<A, B>(
    onfulfilled?: ((v: { data: Row[] | null; error: null }) => A | PromiseLike<A>) | null,
    onrejected?: ((reason: any) => B | PromiseLike<B>) | null
  ): PromiseLike<A | B> {
    return Promise.resolve({ data: this.#resolve(), error: null }).then(onfulfilled, onrejected);
  }
}

export function fakeSupabase(data: FakeData) {
  return {
    from(table: string) {
      const rows = data.tables[table];
      if (!rows) {
        throw new Error(
          `fake-supabase: no fixture for table "${table}". Add it to the fixture ` +
            'or stop querying it.'
        );
      }
      return new Query(rows);
    },

    async rpc(name: string, args: Row = {}) {
      const fn = data.rpc?.[name];
      if (!fn) throw new Error(`fake-supabase: no fixture for function "${name}"`);
      return { data: fn(args), error: null };
    },

    /**
     * Reads only, like everything else here (spec 0004). `createSignedUrls` is
     * the one storage call a `load` makes; uploading and removing happen in
     * form actions, which have no seam.
     *
     * A missing object comes back with a null URL and an error rather than
     * throwing, because that is what Supabase does — and it is the case the
     * initials fallback has to survive, so a test needs to be able to produce
     * it. An unfixtured *bucket* still throws: that is a wrong call, not a
     * dangling path.
     */
    storage: {
      from(bucket: string) {
        const objects = data.buckets?.[bucket];
        if (!objects) {
          throw new Error(
            `fake-supabase: no fixture for bucket "${bucket}". Add it to the ` +
              'fixture or stop reading from it.'
          );
        }
        return {
          async createSignedUrls(paths: string[], expiresIn: number) {
            return {
              data: paths.map((path) =>
                objects.includes(path)
                  ? { path, signedUrl: `signed:${bucket}/${path}?exp=${expiresIn}`, error: null }
                  : { path, signedUrl: null, error: 'Object not found' }
              ),
              error: null
            };
          }
        };
      }
    },

    auth: {
      async getUser() {
        return { data: { user: data.user ?? null }, error: null };
      }
    }
  } as any;
}
