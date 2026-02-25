import { vi } from "vitest";

/**
 * Creates a chainable mock that mimics Drizzle ORM's query builder pattern.
 * Each method returns `this` for chaining, with the terminal method returning
 * whatever `resolvedValue` is set to.
 *
 * Usage:
 *   const mock = createDbMock();
 *   mock._resolveWith([{ id: "1", name: "Team" }]);
 *   const result = await mock.select().from(table).where(cond);
 *   // result === [{ id: "1", name: "Team" }]
 */
export function createDbMock() {
  let resolvedValue: unknown = [];

  const chain: Record<string, ReturnType<typeof vi.fn>> = {};

  const terminalMethods = ["limit", "returning", "execute"];

  const proxy = new Proxy(chain, {
    get(_target, prop: string) {
      if (prop === "_resolveWith") {
        return (value: unknown) => {
          resolvedValue = value;
        };
      }
      if (prop === "_reset") {
        return () => {
          resolvedValue = [];
          Object.values(chain).forEach((fn) => fn.mockClear());
        };
      }
      if (prop === "then") {
        return (resolve: (v: unknown) => void) => resolve(resolvedValue);
      }
      if (!chain[prop]) {
        if (terminalMethods.includes(prop)) {
          chain[prop] = vi.fn().mockImplementation(() => {
            return Promise.resolve(resolvedValue);
          });
        } else if (prop === "transaction") {
          chain[prop] = vi.fn().mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
            return fn(proxy);
          });
        } else {
          chain[prop] = vi.fn().mockReturnValue(proxy);
        }
      }
      return chain[prop];
    },
  });

  return proxy as unknown as ReturnType<typeof createDbMock>;
}

export type MockDb = ReturnType<typeof createDbMock> & {
  _resolveWith: (value: unknown) => void;
  _reset: () => void;
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  from: ReturnType<typeof vi.fn>;
  where: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
  values: ReturnType<typeof vi.fn>;
  returning: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  orderBy: ReturnType<typeof vi.fn>;
  innerJoin: ReturnType<typeof vi.fn>;
  transaction: ReturnType<typeof vi.fn>;
  execute: ReturnType<typeof vi.fn>;
};
