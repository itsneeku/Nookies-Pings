/**
 * Type-aware util to wrap throwing fns into neverthrow Results.
 */
import { err, ok, Result, ResultAsync } from "neverthrow";

// deno-lint-ignore no-explicit-any
type AnyFn = (...args: any[]) => any;

type SafeResult<F> = F extends (...args: infer A) => Promise<infer T>
  ? (...args: A) => ResultAsync<T, unknown>
  : F extends (...args: infer A) => infer T ? (...args: A) => Result<T, unknown>
  : never;

// Overload: async function
export function mkSafe<A extends unknown[], T>(
  fn: (...args: A) => Promise<T>,
): (...args: A) => ResultAsync<T, unknown>;

// Overload: sync function
export function mkSafe<A extends unknown[], T>(
  fn: (...args: A) => T,
): (...args: A) => Result<T, unknown>;

// Overload: instance method
export function mkSafe<O, K extends keyof O>(
  obj: O,
  method: K,
): SafeResult<O[K]>;

// the beauty itself
export function mkSafe(
  fnOrObj: AnyFn | object,
  method?: PropertyKey,
): AnyFn {
  if (method !== undefined) {
    const obj = fnOrObj as Record<PropertyKey, AnyFn>;
    return (...args: unknown[]) => {
      try {
        const result = obj[method](...args);
        if (result instanceof Promise) {
          return ResultAsync.fromPromise(result, (e) => e);
        }
        return ok(result);
      } catch (e) {
        return err(e);
      }
    };
  }

  const fn = fnOrObj as AnyFn;
  return (...args: unknown[]) => {
    try {
      const result = fn(...args);
      if (result instanceof Promise) {
        return ResultAsync.fromPromise(result, (e) => e);
      }
      return ok(result);
    } catch (e) {
      return err(e);
    }
  };
}
