import { useEffect, useRef } from "react";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import { schema, Schema } from "normalizr";
import { ToastMessage, useAddMessage } from "@react-md/alert";

import type { RootState, AppDispatch } from "./setupStore";
import { Denormalized, denormalizedEntity, InferResult } from "./selectors";

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export function useAddToast() {
  const addMessage = useAddMessage();
  return function (text: string) {
    const message: ToastMessage = { children: text };
    addMessage(message);
  };
}

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

/**
 * Denormalizes all entities corresponding to `schemas` values.
 *
 * The keys are the names of the returned object and the values are the singualar
 * schema value of the normalized entities to denormalize and return.
 */
export function useAppAllEntitiesSelector<
  S extends Record<string, schema.Entity>
>(schemas: S): { [K in keyof S]: NonNullable<Denormalized<S[K]>>[] } {
  return useAppSelector((state) =>
    Object.fromEntries(
      Object.entries(schemas).map(([key, s]) => {
        const allIds = Object.keys(
          state.entities[s.key as keyof typeof state.entities]
        );
        return [key, denormalizedEntity(state, allIds, new schema.Array(s))];
      })
    )
  ) as { [K in keyof S]: Denormalized<S[K]> };
}
