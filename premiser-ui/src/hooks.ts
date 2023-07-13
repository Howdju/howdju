import { useEffect, useRef } from "react";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import { denormalize, schema, Schema } from "normalizr";

import type { RootState, AppDispatch } from "./setupStore";
import { EntityId } from "howdju-common";

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export function usePreviousValue<T>(value: T) {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}

type InferResult<S> = S extends schema.Entity<any>
  ? EntityId
  : S extends schema.Array<any>
  ? EntityId[]
  : S extends object
  ? { [K in keyof S]: InferResult<S[K]> }
  : never;
type Denormalized<S> = S extends schema.Entity<infer U>
  ? U | undefined
  : S extends schema.Array<infer U>
  ? U[]
  : S extends object
  ? { [K in keyof S]: Denormalized<S[K]> }
  : never;
/** Denormalizes an entity from the state. */
export function useAppEntitySelector<S extends Schema>(
  result: InferResult<S>,
  schema: S
): Denormalized<S> {
  return useAppSelector((state) => denormalize(result, schema, state.entities));
}
