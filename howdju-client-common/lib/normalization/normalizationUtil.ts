import { get, merge, reduce, set } from "lodash";
import moment from "moment";

/** Iteratively applies customizations to an entity. */
export function applyCustomizations<T>(
  entity: T,
  ...customizations: ((entity: T) => T)[]
) {
  const result = reduce(
    customizations,
    (entity, customization) => {
      const customized = customization(entity);
      return customized || entity;
    },
    entity
  );
  return result;
}

/** Converts path to moment */
export function momentConversion(path: string) {
  return <T>(entity: T) => {
    const value = get(entity, path);
    if (value) {
      const result = merge(entity, set({}, path, moment(value)));
      return result;
    }
    return entity;
  };
}
