/**
 * Type-aware utils to wrap throwing functions into neverthrow Results
 */
import { Result, ResultAsync } from "neverthrow";

type AsyncFn<A extends unknown[] = unknown[], T = unknown> = (
  ...args: A
) => Promise<T>;

type SafeBound<M> = M extends (...args: infer A) => Promise<infer T>
  ? (...args: A) => ResultAsync<T, unknown>
  : never;

export const wrapAsync = <A extends unknown[], T>(
  fn: AsyncFn<A, T>,
) => ResultAsync.fromThrowable(fn, (e) => e);

export const wrap = <A extends unknown[], T>(
  fn: (...args: A) => T,
) => Result.fromThrowable(fn, (e) => e);

// for instance methods
export const mkSafe = <O, K extends keyof O>(
  obj: O,
  method: K,
) =>
  ((...args: unknown[]) =>
    wrapAsync(
      () => (obj[method] as AsyncFn)(...args),
    )()) as SafeBound<O[K]>;
