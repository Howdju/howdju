import {
  has,
  isArray,
  isPlainObject,
  mergeWith,
  zip,
  cloneDeepWith,
} from "lodash";
import { isMoment } from "moment";

import { mapValuesDeep } from "howdju-common";

/**
 * Deeply replaces all Moments with expect.toBeSameMoment.
 *
 * Use on a Jest expected value containing Moments to get reasonable match behavior.
 */
export function expectToBeSameMomentDeep(value: any) {
  return mapValuesDeep(value, (v) =>
    // Can't add `import { expect } from "@jest/globals";` above or else the esbuild fails.
    // So just typecast expect.
    // TODO(388) remove the typecast.
    isMoment(v) ? (expect as any).toBeSameMoment(v) : v
  );
}

/** A placeholder for values to remove. */
const tombstone = {};

/**
 * Returns an object having only the keys of the given shape, with the values
 * from the source object.
 *
 * @param shapeObj The object that determines valid keys.
 * @param valuesObj The object that determines the values.
 * @returns
 */
export function restrictObject<S>(shapeObj: S, valuesObj: any): S {
  if (shapeObj === undefined) {
    return valuesObj;
  }
  if (!isArray(shapeObj) && !isPlainObject(shapeObj)) {
    // If the source has the same type, then it provides a valid override. Otherwise it has the
    // wrong shape and the original value is kept.
    return typeof shapeObj === typeof valuesObj ? valuesObj : shapeObj;
  }
  const merged = mergeWith(
    shapeObj,
    valuesObj,
    (objValue: any, srcValue: any, key: string, obj: S) => {
      if (objValue === undefined) {
        return tombstone;
      }
      if (isArray(objValue)) {
        if (!isArray(srcValue)) {
          return objValue;
        }
        return zip(objValue, srcValue).map(([a, b]) => restrictObject(a, b));
      }
      if (!has(obj, key)) {
        return tombstone;
      }
      if (srcValue === undefined) {
        return objValue;
      }
      if (isPlainObject(srcValue)) {
        return restrictObject(objValue, srcValue);
      }
      return srcValue;
    }
  );
  removeTombstones(merged);
  return merged;
}

function removeTombstones<T>(obj: T) {
  for (const prop in obj) {
    if (obj[prop] === tombstone) {
      delete obj[prop];
    } else if (isPlainObject(obj[prop]) || isArray(obj[prop])) {
      removeTombstones(obj[prop]);
    }
  }
}

export function cloneDeep<T>(obj: T): T {
  return cloneDeepWith(obj, (val: any) =>
    isMoment(val) ? val.clone() : undefined
  );
}
