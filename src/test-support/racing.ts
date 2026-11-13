// Epic 24 (24-S2): a database client for commit-path tests whose puzzle
// reads are each followed, the first `times` times, by `interfere`: a racing
// write landing between the read and the compare-and-swap. The same
// technique as 24-S1's inline helper in `commit.db.test.ts`.
import type { PrismaClient } from '@prisma/client';

export function racing(client: PrismaClient, times: number, interfere: () => Promise<unknown>) {
  let remaining = times;
  let reads = 0;
  const delegate = (target: object) => new Proxy(target, {
    get(object, key) {
      const value = Reflect.get(object, key);
      if (typeof value !== 'function') return value;
      if (typeof key === 'string' && key.startsWith('find')) {
        return async (...args: unknown[]) => {
          const result = await value.apply(object, args);
          reads++;
          if (remaining > 0) {
            remaining--;
            await interfere();
          }
          return result;
        };
      }
      return value.bind(object);
    },
  });
  const wrap = (target: object): object => new Proxy(target, {
    get(object, key) {
      const value = Reflect.get(object, key);
      if (key === 'puzzle') return delegate(value);
      if (key === '$transaction') {
        return (work: (tx: object) => unknown, ...rest: unknown[]) =>
          value.call(object, (tx: object) => work(wrap(tx)), ...rest);
      }
      return typeof value === 'function' ? value.bind(object) : value;
    },
  });
  return { client: wrap(client) as PrismaClient, reads: () => reads };
}
