import { mapValues, isPlainObject, toLower, deburr } from "lodash";
import cloneDeepWith from "lodash/cloneDeepWith";
import forEach from "lodash/forEach";
import isArray from "lodash/isArray";
import isFunction from "lodash/isFunction";
import isNumber from "lodash/isNumber";
import isObject from "lodash/isObject";
import isUndefined from "lodash/isUndefined";
import keys from "lodash/keys";
import map from "lodash/map";
import reduce from "lodash/reduce";
import reject from "lodash/reject";
import replace from "lodash/replace";
import trim from "lodash/trim";
import moment, { Moment, unitOfTime, Duration, TemplateFunction } from "moment";
import { create as createRandomSeed } from "random-seed";
import bases from "bases";

import { newProgrammingError } from "./commonErrors";

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
  } else if (isObject(obj)) {
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
  const logError = () => console.error("Failed assertion: " + makeMessage());
  /* eslint-enable no-console */

  if (isFunction(test)) {
    if (!test()) {
      logError();
    }
  } else if (!test) {
    logError();
  }
};

export const isDefined = (val: any) => !isUndefined(val);

export const utcNow = () => moment.utc();

export const utcNowIsAfter = (dateTimeString: string) =>
  utcNow().isAfter(moment.utc(dateTimeString));

type MomentArithmeticArg =
  | [number, unitOfTime.DurationConstructor]
  | { [k in unitOfTime.DurationConstructor]+?: number }
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

/** TODO isn't this the same as target.concat(source)? */
export const pushAll = (target: any[], source: any[]) => {
  forEach(source, (item) => {
    target.push(item);
  });
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

export const decodeQueryStringObject = (param: string | undefined) => {
  if (!param) {
    return param;
  }

  const keyVals = param.split(",");

  const obj: Record<string, string> = {};
  forEach(keyVals, (keyVal) => {
    const [key, val] = keyVal.split("=");
    obj[key] = val;
  });

  return obj;
};

export interface SortDescriptor {
  property: string;
  direction: "ASC" | "DESC";
}

export const encodeSorts = (sorts: SortDescriptor[]) =>
  map(sorts, ({ property, direction }) => `${property}=${direction}`).join(",");

export const decodeSorts = (param: string) => {
  if (!param) {
    return param;
  }

  const propertyDirections = param.split(",");

  const sorts: SortDescriptor[] = [];
  forEach(propertyDirections, (propertyDirection) => {
    const [property, direction] = propertyDirection.split("=");
    assert(["DESC", "ASC"].indexOf(direction) > 0);
    sorts.push({ property, direction: direction as "ASC" | "DESC" });
  });

  return sorts;
};

/** Removes linebreaks from a string, ensuring whitespace between the joined characters */
export const toSingleLine = (val: string) =>
  val.replace(
    /(\s*)[\r\n]+(\s*)/,
    (_match, leadingWhitespace, trailingWhitespace) => {
      return leadingWhitespace.length === 0 && trailingWhitespace.length === 0
        ? // If the linebreak(s) have no whitespace around them, then insert some
          " "
        : // Otherwise just use the existing whitespace
          "";
    }
  );

export const cleanWhitespace = (text: string) => {
  text = trim(text);
  text = replace(text, /\s+/g, " ");
  return text;
};

export const toSlug = (text: string) =>
  text &&
  normalizeText(text)
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-_]/g, "");

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

export const toJson = function toJson(val: any) {
  return JSON.stringify(val);
};

export const fromJson = function fromJson(json: string) {
  return JSON.parse(json);
};

export const normalizeText = (text: string) => {
  // Postgres SQL for the same
  // regexp_replace(lower(regexp_replace(trim(text), '\s+', ' ', 'g')), '[^[:alnum:][:space:]_.]', '', 'g')
  text = toLower(text);
  text = deburr(text);
  text = replace(text, /[^\w\s]/g, "");
  text = cleanWhitespace(text);

  return text;
};

const randomSeed = createRandomSeed();

export const randomBase36Number = (length: number) => {
  const minValue = bases.fromBase("0".repeat(length), 36);
  const maxValue = bases.fromBase("z".repeat(length), 36);
  return bases.toBase(randomSeed.intBetween(minValue, maxValue), 36);
};

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