import "lodash";

declare module "lodash" {
  interface LoDashStatic {
    /**
     * Extend isPlainObject to be a type guard.
     */
    isPlainObject(value?: any): value is object;
  }
}
