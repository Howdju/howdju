import {
  mapValues,
  isPlainObject as lodashIsPlainObject,
  toLower,
  deburr,
  camelCase,
  filter,
  pickBy,
  toString,
  isNumber,
  merge,
  cloneDeepWith,
  forEach,
  isArray,
  isFunction,
  isObject,
  isUndefined,
  keys,
  map,
  reduce,
  reject,
  replace,
  trim,
  identity,
} from "lodash";
import moment, { Moment, unitOfTime, Duration, TemplateFunction } from "moment";
import isAbsoluteUrlLib from "is-absolute-url";

import { newProgrammingError } from "./commonErrors";
import { CamelCasedPropertiesDeep, MergeDeep } from "type-fest";
import { SortDescription, ToFilter } from "./apiModels";

export interface MapValuesOptions {
  /**
   * Whether to map arrays. Default is true.
   *
   * Some mapper functions operate on arrays, such as `uniq`. In that case we want to call the
   * mapper on the whole array rather than its individual items. Use mapArrays=false in that case.
   */
  mapArrays?: boolean;
}

type MapValuesDeepReturn<T, FR, O> = O extends { mapArrays: true }
  ? MapValuesDeepReturn_MapArrays<T, FR>
  : MapValuesDeepReturn_NoMapArrays<T, FR>;

type MapValuesDeepReturn_MapArrays<T, FR> = T extends [any, ...any[]]
  ? { [k in keyof T]: MapValuesDeepReturn_MapArrays<T[k], FR> }
  : T extends any[]
  ? { [k: number]: MapValuesDeepReturn_MapArrays<T[number], FR> }
  : T extends object
  ? { [k in keyof T]: MapValuesDeepReturn_MapArrays<T[k], FR> }
  : FR;

type MapValuesDeepReturn_NoMapArrays<T, FR> = T extends any[]
  ? FR
  : T extends object
  ? { [k in keyof T]: MapValuesDeepReturn_NoMapArrays<T[k], FR> }
  : FR;

/**
 * Override for mapping only object keys.
 *
 * If the target is an object and we don't map arrays, the key can only be a string, which
 * simplifies the mapper.  */
export function mapValuesDeep<
  T extends object,
  F extends (x: any, key: string) => any,
  O extends MapValuesOptions & { mapArrays: false }
>(
  obj: T,
  fn: F,
  options: O,
  key?: string
): MapValuesDeepReturn_NoMapArrays<T, ReturnType<F>>;
/** Override accepting generic arguments. */
export function mapValuesDeep<
  T,
  F extends (x: any, key: string | number | undefined) => any,
  O extends MapValuesOptions
>(
  obj: T,
  fn: F,
  options?: O,
  key?: string | number
): MapValuesDeepReturn<T, ReturnType<F>, O>;
/**
 * Recursively map the values of obj using fn.
 *
 * key is the key or index of obj's parent that got us here. */
export function mapValuesDeep<
  T,
  F extends (x: any, key: string | number | undefined) => any,
  O extends MapValuesOptions
>(
  obj: T,
  fn: F,
  options: O = { mapArrays: true } as O,
  key?: string | number
): MapValuesDeepReturn<T, ReturnType<F>, O> {
  const { mapArrays } = options;
  if (isArray(obj)) {
    if (mapArrays) {
      return map(obj, (item, idx) =>
        mapValuesDeep(item, fn, options, idx)
      ) as MapValuesDeepReturn<T, ReturnType<F>, O>;
    }
    // Fall through
  } else if (isPlainObject(obj)) {
    return mapValues(obj, (val, key) =>
      mapValuesDeep(val, fn, options, key)
    ) as MapValuesDeepReturn<T, ReturnType<F>, O>;
  }
  return fn(obj, key);
}

type MapKeysDeepReturn<T, FR extends string> = T extends [any, ...any[]]
  ? { [k in keyof T as FR]: MapKeysDeepReturn<T[k], FR> }
  : T extends any[]
  ? { [k: number]: MapKeysDeepReturn<T[number], FR> }
  : T extends object
  ? { [k in keyof T as FR]: MapKeysDeepReturn<T[k], FR> }
  : T;

/** key is the original key or index of obj's parent that got us here. */
export const mapKeysDeep = <
  T extends Record<string, any> | ArrayLike<any>,
  F extends (key: string, parentKey?: string | number) => string
>(
  obj: T,
  fn: F,
  parentKey: string | number | undefined = undefined
): MapKeysDeepReturn<T, ReturnType<F>> => {
  if (isArray(obj)) {
    return map(obj, (item, idx) =>
      mapKeysDeep(item, fn, idx)
    ) as unknown as MapKeysDeepReturn<T, ReturnType<F>>;
  }
  if (isPlainObject(obj)) {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [
        fn(k, parentKey),
        mapKeysDeep(v, fn, k),
      ])
    ) as MapKeysDeepReturn<T, ReturnType<F>>;
  }
  return obj as MapKeysDeepReturn<T, ReturnType<F>>;
};

export function camelCaseKeysDeep<T extends Record<string, any>>(val: T) {
  return mapKeysDeep(val, camelCase) as unknown as CamelCasedPropertiesDeep<T>;
}

/** Sadly @types/lodash doesn't define this as a typeguard. */
export function isPlainObject(val: any): val is object {
  return lodashIsPlainObject(val);
}

// https://stackoverflow.com/a/27093173/39396
export const minDate = () => new Date(-8640000000000000);

export const zeroDate = () => new Date(0);

export const isTruthy = (val: any) => !!val;

export const isFalsey = (val: any) => !val;

export const assert = (
  test: boolean | ((...args: any[]) => boolean),
  message?: string | (() => string)
) => {
  if (process.env.DO_ASSERT !== "true") {
    return;
  }
  const makeMessage = () =>
    // If there is a message thunk, use it
    isFunction(message)
      ? message()
      : // Otherwise if there is a message, use it
      message
      ? message
      : // Otherwise, if the test was a thunk, use it as a description
      isFunction(test)
      ? test.toString().substring(0, 1024)
      : // Otherwise, not much else we can do
        message;
  // assert should only be used in development, so logging to the console should be ok.  Besides, how would we get a logger here?
  /* eslint-disable no-console */
  const logError = () => console.error(`Failed assertion: ${makeMessage()}`);
  /* eslint-enable no-console */

  if (isFunction(test)) {
    if (!test()) {
      logError();
    }
  } else if (!test) {
    logError();
  }
};

export const isDefined = <T>(val: T | undefined): val is T => !isUndefined(val);

export const utcNow = () => moment.utc();

export function utcNowIsAfter(dateTimeString: string) {
  return utcNow().isAfter(moment.utc(dateTimeString));
}

export type DurationConstructorObject = {
  [k in unitOfTime.DurationConstructor]+?: number;
};
/** Object that describes how to display a duration */
export type DurationDisplayInfo = {
  value: DurationConstructorObject;
  formatTemplate: string;
  formatTrim: string;
};

type MomentArithmeticArg =
  | [number, unitOfTime.DurationConstructor]
  | DurationConstructorObject
  | Duration;
export const momentAdd = (
  momentInstance: Moment,
  summand: MomentArithmeticArg
) => {
  // add mutates the instance, so we must clone first
  const result = momentInstance.clone();
  if (isArray(summand)) {
    result.add(summand[0], summand[1]); // [5, 'minutes']
  } else if (isObject(summand)) {
    result.add(summand); // {minutes: 5} or Duration
  } else {
    throw newProgrammingError(
      `Invalid moment summand: ${summand} (type: ${typeof summand})`
    );
  }

  return result;
};
// Reference for these interesting operand names
// https://math.stackexchange.com/a/1736991/116432
export const momentSubtract = (
  momentInstance: Moment,
  subtrahend: MomentArithmeticArg
) => {
  // add mutates the instance, so we must clone first
  const result = momentInstance.clone();
  if (isArray(subtrahend)) {
    result.subtract(subtrahend[0], subtrahend[1]); // [5, 'minutes']
  } else if (isObject(subtrahend)) {
    result.subtract(subtrahend); // {minutes: 5}
  } else {
    throw newProgrammingError(
      `Invalid moment subtrahend: ${subtrahend} (type: ${typeof subtrahend})`
    );
  }
  return result;
};

export const differenceDuration = (moment1: Moment, moment2: Moment) => {
  return moment.duration(moment1.diff(moment2));
};

export const formatDuration = (
  duration: Duration,
  { template, trim }: { template: string | TemplateFunction; trim: string }
) => {
  moment.duration(duration).format(template, { trim });
};

export const timestampFormatString = "YYYY-MM-DDTHH:mm:ss.SSS[Z]";

export const utcTimestamp = () => utcNow().format(timestampFormatString);

/** @deprecated This helper is obsolete with TypeScript. With TS, we need constant-valued objects. */
export const arrayToObject = (items: any, itemKey?: string) =>
  reduce(
    items,
    (acc, item) => {
      if (itemKey) {
        acc[item[itemKey]] = item;
      } else {
        acc[item] = item;
      }
      return acc;
    },
    {} as Record<string, string>
  );

export const pushAll = (target: any[], source: any[]) => {
  target.splice(target.length, 0, ...source);
  return target;
};

export const insertAt = (array: any[], index: number, item: any) => {
  if (!isArray(array)) {
    throw new Error("first argument must be an array; was: " + typeof array);
  }
  if (!isNumber(index)) {
    throw new Error("second argument must be number; was: " + typeof index);
  }

  array.splice(index, 0, item);
  return array;
};

export const insertAllAt = (array: any[], index: number, items: any[]) => {
  if (!isArray(array)) {
    throw new Error("first argument must be an array; was: " + typeof array);
  }
  if (!isNumber(index)) {
    throw new Error("second argument must be number; was: " + typeof index);
  }
  if (!isArray(items)) {
    throw new Error("third argument must be an array; was: " + typeof items);
  }

  const args = [index, 0].concat(items) as [
    start: number,
    deleteCount: number,
    ...items: any[]
  ];
  Array.prototype.splice.apply(array, args);
  return array;
};

export const removeAt = (array: any[], index: number) => {
  array.splice(index, 1);
  return array;
};

export const encodeQueryStringObject = (obj: object) =>
  map(obj, (val, key) => `${key}=${val}`).join(",");

/**
 * Decodes query string `param` into an object.
 *
 * @param param The query string to decode, e.g. `foo=bar,baz=qux`
 * @param validKeys If provided, throws an error if any of the keys in the query string are not in this array.
 */
export function decodeQueryStringObject<K extends readonly string[]>(
  param: string | undefined,
  validKeys?: K
): ToFilter<K> | undefined {
  if (!param) {
    return undefined;
  }

  const keyVals = param.split(",");

  const invalidKeys: string[] = [];
  const obj: Record<string, string> = {};
  forEach(keyVals, (keyVal) => {
    const [key, val] = keyVal.split("=");
    obj[key] = val;
    if (validKeys && !validKeys.includes(key)) {
      invalidKeys.push(key);
    }
  });

  if (invalidKeys.length) {
    const invalidKeysString = invalidKeys.map((k) => `"${k}"`).join(",");
    const validKeysString = validKeys?.map((k) => `"${k}"`).join(",");
    throw new Error(
      `Invalid query string keys: [${invalidKeysString}]. Valid keys are: [${validKeysString}]`
    );
  }

  return obj;
}

export const encodeSorts = (sorts: SortDescription[]) =>
  map(sorts, ({ property, direction }) => `${property}=${direction}`).join(",");

export const decodeSorts = (param: string | undefined) => {
  if (!param) {
    return [];
  }

  const propertyDirections = param.split(",");

  const sorts: SortDescription[] = [];
  forEach(propertyDirections, (propertyDirection) => {
    const [property, direction] = propertyDirection.split("=");
    assert(["ascending", "descending"].indexOf(direction) > 0);
    sorts.push({
      property,
      direction: direction as "ascending" | "descending",
      // There is no `value` because those are not supported in query params
    });
  });

  return sorts;
};

/** Removes linebreaks from a string, ensuring whitespace between the joined characters */
export const toSingleLine = (val: string | number) =>
  isNumber(val)
    ? toString(val)
    : val
        // Remove leading newlines
        .replace(/^[\r\n]/, "")
        // Remove trailing newlines
        .replace(/[\r\n]$/, "")
        // Remove other newlines, replacing with space if they lacked other surrounding whitespace.
        .replace(
          /(\s*)[\r\n]+(\s*)/,
          (_match, leadingWhitespace, trailingWhitespace) => {
            return !leadingWhitespace && !trailingWhitespace ? " " : "";
          }
        );

export const omitDeep = function omitDeep(
  value: any,
  predicate = (val: any) => !val
) {
  return cloneDeepWith(value, makeOmittingCloneDeepCustomizer(predicate));
};

function makeOmittingCloneDeepCustomizer(predicate: (val: any) => boolean) {
  return function omittingCloneDeepCustomizer(value: any) {
    if (isObject(value)) {
      if (isArray(value)) {
        let result = reject(value, predicate);
        result = map(result, (item) =>
          cloneDeepWith(item, omittingCloneDeepCustomizer)
        );
        return result;
      }

      const clone: { [k: string]: any } = {};
      for (const subKey of Object.keys(value)) {
        if (!predicate((value as { [k: string]: any })[subKey])) {
          clone[subKey] = cloneDeepWith(
            (value as { [k: string]: any })[subKey],
            omittingCloneDeepCustomizer
          );
        }
      }
      return clone;
    }

    return undefined;
  };
}

export const keysTo = (obj: { [k: string]: any }, val: any) =>
  reduce(
    keys(obj),
    (acc, key) => {
      acc[key] = val;
      return acc;
    },
    {} as { [k: string]: typeof val }
  );

export function toJsonWithReplacer(val: any, replacer: (val: any) => any) {
  const seen = new WeakSet();
  return JSON.stringify(val, handleCircularReferences(seen, replacer));
}

export function toJson(val: any) {
  const seen = new WeakSet();
  return JSON.stringify(val, handleCircularReferences(seen));
}

function handleCircularReferences(
  seen: WeakSet<any>,
  replacer: (val: any) => any = identity
) {
  return function (_key: string, value: any) {
    if (value === null || typeof value !== "object") {
      return value;
    }

    if (seen.has(value)) {
      return "[Circular]";
    }

    if (value.toJSON) {
      return value.toJSON();
    }

    seen.add(value);

    const newValue: Record<string, any> = Array.isArray(value) ? [] : {};

    for (const [key, val] of Object.entries(value)) {
      const replaced = replacer(val);
      newValue[key] = handleCircularReferences(seen, replacer)(key, replaced);
    }

    seen.delete(value);

    return newValue;
  };
}

export const fromJson = function fromJson(json: string) {
  return JSON.parse(json);
};

export const cleanWhitespace = (text: string) => {
  text = trim(text);
  text = replace(text, /\s+/g, " ");
  return text;
};

export function toSlug(text: string) {
  if (!text) {
    return text;
  }
  text = toLower(text);
  text = deburr(text);
  return text.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9_-]/g, "");
}

export const normalizeText = (text: string) => {
  // Postgres SQL for the same
  // regexp_replace(lower(regexp_replace(trim(text), '\s+', ' ', 'g')), '[^[:alnum:][:space:]_.]', '', 'g')
  text = toLower(text);
  text = deburr(text);
  text = replace(text, /[^\w\s]/g, "");
  text = cleanWhitespace(text);

  return text;
};

/**
 * Normalizes quotation text.
 *
 * Quotations are more permissive with their normal text, since special characters like
 * emoji,
 */
export function normalizeQuotation(text: string) {
  text = toLower(text);
  // https://unicode.org/reports/tr18/#General_Category_Property
  text = replace(text, /[\p{Mark}\p{Punctuation}\p{Zl}\p{Zp}\p{Other}]/gu, " ");
  text = cleanWhitespace(text);
  return text;
}

type InferKey<T> = T extends Partial<Record<infer K, any>> ? K : never;
type InferValue<T> = T extends Partial<Record<any, infer V>> ? V : never;
export const toEntries = <T extends Partial<Record<string, any>>>(
  obj: T | undefined
) => {
  if (!obj) {
    return [];
  }
  return Object.entries(obj) as [InferKey<T>, InferValue<T>][];
};

/** Removes undefined values. */
export function filterDefined<T>(
  items: Record<string, T | undefined>
): Record<string, T>;
/** Removes undefined items. */
export function filterDefined<T>(items: (T | undefined)[]): T[];
export function filterDefined<T>(
  items: (T | undefined)[] | Record<string, T | undefined>
): T[] | Record<string, T> {
  // Filtering with the default identity function will remove everything falsy.
  if (isArray(items)) {
    return filter(items, (i) => i !== undefined) as T[];
  }
  return pickBy(items, (i) => i !== undefined) as Record<string, T>;
}

/**
 * Supports async sleep.
 *
 * ```
 * await sleep(1000);
 * ```
 */
export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(() => resolve(), ms));
}

/**
 * Merge two values without mutating either.
 *
 * lodash's merge's types do not correctly merge the types of subarrays. type-fest's
 * MergeDeep does support it, but attempting to extend lodash's merge's types to support this
 * for three sources results in `Type instantiation is excessively deep and possibly infinite.
 * ts(2589)`. So we provide this helper that only needs to merge two sources since the third
 * one is an empty object to achieve the copy.
 *
 * This is how we could try to extend lodash's types in a `lodash.d.ts` file:
 *
 * ```
 *  import { MergeDeep } from "type-fest";
 *  declare module "lodash" {
 *    interface LoDashStatic {
 *      // ...
 *      // This results in `Type instantiation is excessively deep and possibly infinite. ts(2589)`
 *      merge<TObject, TSource1, TSource2>(
 *        object: TObject,
 *        source1: TSource1,
 *        source2: TSource2
 *      ): MergeDeep<MergeDeep<TObject, TSource1>, TSource2>;
 *     // ...
 *    }
 *  }
 *  ```
 */
export function mergeCopy<
  Source1 extends Record<any, any>,
  Source2 extends Record<any, any>
>(
  source1: Source1 | undefined,
  source2: Source2 | undefined
): MergeDeep<
  Source1,
  Source2,
  { arrayMergeMode: "spread"; recurseIntoArrays: true }
>;
export function mergeCopy<Source1 extends any[], Source2 extends any[]>(
  source1: Source1,
  source2: Source2
): MergeDeep<
  Source1,
  Source2,
  { arrayMergeMode: "spread"; recurseIntoArrays: true }
>;
export function mergeCopy<Source1, Source2>(
  source1: Source1,
  source2: Source2
) {
  if (isArray(source1) !== isArray(source2)) {
    throw newProgrammingError(
      `mergeCopy requires two objects or two arrays: ${typeof source1} and ${typeof source2}`
    );
  }
  const init = isArray(source1) ? [] : {};
  return merge(init, source1, source2);
}

export function isAbsoluteUrl(val: any): val is string {
  return isAbsoluteUrlLib(val);
}
