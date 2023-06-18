type ValueOf<Obj> = Obj[keyof Obj];
type OneOnly<Obj, Key extends keyof Obj> = {
  [key in Exclude<keyof Obj, Key>]+?: undefined;
} & Pick<Obj, Key>;
type OneOfByKey<Obj> = { [key in keyof Obj]: OneOnly<Obj, key> };
/**
 * A type where only one of the object properties may be defined.
 *
 * May have a problem requiring explicitly setting other properties to undefined.
 */
export type OneOf<Obj> = ValueOf<OneOfByKey<Obj>>;

/**
 * An object with a shape conforming to another type, but holding a value at each field.
 *
 * @typeparam T the shape of the object
 * @typeparam P the name of the property where the value is stored. It should have some prefix like
 * an underscore to prevent collisions with properties of T.
 * @typeparam U the type held by each field.
 */
export type RecursiveObject<T, P extends string = "_value", U = string> = {
  P?: U;
} & (NonNullable<T> extends [any, ...any[]]
  ? { [K in keyof NonNullable<T>]?: RecursiveObject<NonNullable<T>[K], P, U> }
  : NonNullable<T> extends any[]
  ? { [k: number]: RecursiveObject<NonNullable<T>[number], P, U> }
  : NonNullable<T> extends object
  ? { [K in keyof NonNullable<T>]?: RecursiveObject<NonNullable<T>[K], P, U> }
  : unknown);

/** Use this type instead of `{}` to address @typescript-eslint/ban-types. */
export type EmptyObject = Record<never, any>;
