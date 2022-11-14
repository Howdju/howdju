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

// A map of maps bottoming out in some type
export type RecursiveObject<T> = { [key: string]: T | RecursiveObject<T> };
