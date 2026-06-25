/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
// Stub Supabase client for local development without a real Supabase instance.
// Returns empty/mock data so routes resolve instead of throwing connection errors.

function stubEmpty(): { data: null; error: null } {
  return { data: null, error: null };
}

function createStubQueryBuilder(): Record<string, any> {
  const noop = () => builder;

  const builder: Record<string, any> = {
    select: noop,
    insert: noop,
    update: noop,
    delete: noop,
    upsert: noop,
    eq: noop,
    neq: noop,
    gt: noop,
    gte: noop,
    lt: noop,
    lte: noop,
    is: noop,
    in: noop,
    or: noop,
    order: noop,
    limit: noop,
    range: noop,
    single: () => Promise.resolve(stubEmpty()),
    maybeSingle: () => Promise.resolve(stubEmpty()),
    then: (resolve: (v: any) => any) => resolve({ data: [], error: null }),
  };

  return builder;
}

export function createStubSupabaseClient(): Record<string, any> {
  return {
    from: (table: string) => createStubQueryBuilder(),
    rpc: (fn: string, params?: Record<string, unknown>) => Promise.resolve(stubEmpty()),
    auth: {
      getUser: () => Promise.resolve(stubEmpty()),
      getSession: () => Promise.resolve(stubEmpty()),
    },
  };
}
