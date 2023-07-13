import { useEffect, useRef } from "react";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import { denormalize, schema } from "normalizr";

import type { RootState, AppDispatch } from "./setupStore";
import { EntityId, PersistedEntity } from "howdju-common";

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
export function useAppEntitySelector<T extends PersistedEntity>(
  entityId: EntityId,
  schema: schema.Entity<T>
): T | undefined;
/** Denormalizes a list of entities from the state. */
export function useAppEntitySelector<T extends PersistedEntity>(
  entityIds: EntityId[],
  schema: schema.Array<T>
): T[];
export function useAppEntitySelector<T extends PersistedEntity>(
  entityId: EntityId | EntityId[],
  schema: schema.Entity<T> | schema.Array<T>
) {
  return useAppSelector((state) =>
    denormalize(entityId, schema, state.entities)
  );
}
