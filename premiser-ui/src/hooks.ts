import { useEffect, useRef } from "react";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import { Schema } from "normalizr";

import type { RootState, AppDispatch } from "./setupStore";
import { Denormalized, denormalizedEntity, InferResult } from "./selectors";

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

/** Denormalizes an entity from the state. */
export function useAppEntitySelector<S extends Schema>(
  result: InferResult<S>,
  schema: S
): Denormalized<S> {
  return useAppSelector((state) => denormalizedEntity(state, result, schema));
}
