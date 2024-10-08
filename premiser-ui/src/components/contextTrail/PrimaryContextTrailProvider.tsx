import React, { createContext, ReactNode } from "react";
import queryString from "query-string";
import { isArray, isEmpty, map, some } from "lodash";
import { useLocation } from "react-router";
import { Location } from "history";
import useDeepCompareEffect from "use-deep-compare-effect";
import { denormalize } from "normalizr";

import {
  ConnectingEntity,
  ContextTrailItem,
  ContextTrailItemInfo,
  parseContextTrail,
  toJson,
} from "howdju-common";
import { api, normalizationSchemaByEntityType } from "howdju-client-common";

import { logger } from "@/logger";
import { useAppDispatch, useAppSelector } from "@/hooks";
import { RootState } from "@/setupStore";

/**
 * Obtains the context trail from the query params and API for the PrimaryContextTrail context.
 */
export function PrimaryContextTrailProvider({
  children,
}: {
  children: ReactNode;
}) {
  const location = useLocation();
  const { infos, hasInvalidInfos } =
    contextTrailItemInfosFromLocation(location);

  const dispatch = useAppDispatch();

  useDeepCompareEffect(() => {
    if (!hasInvalidInfos && !isEmpty(infos)) {
      dispatch(api.fetchContextTrail(infos));
    }
  }, [infos, hasInvalidInfos, dispatch]);

  const contextTrailItems = useAppSelector((state) =>
    hasInvalidInfos ? [] : toContextTrailItems(state, infos)
  );
  const contextTrailInfos = hasInvalidInfos ? [] : infos;

  const { isInvalidContextTrail } = useAppSelector(
    (state) => state.primaryContextTrail
  );

  const isInvalid = hasInvalidInfos || isInvalidContextTrail;
  return (
    <PrimaryContextTrail.Provider
      value={{ contextTrailInfos, contextTrailItems, isInvalid }}
    >
      {children}
    </PrimaryContextTrail.Provider>
  );
}

/** If the trail was invalid, the items and infos will be empty. */
export const PrimaryContextTrail = createContext<{
  contextTrailInfos: ContextTrailItemInfo[];
  contextTrailItems: ContextTrailItem[];
  isInvalid: boolean;
}>({
  contextTrailInfos: [],
  contextTrailItems: [],
  isInvalid: false,
});

const contextTrailItemInfosFromLocation = (location: Location) => {
  const queryParams = queryString.parse(location.search);
  let contextTrailParam = queryParams["context-trail"];
  if (isArray(contextTrailParam)) {
    logger.error(
      `contextTrailParam can only appear once, but appeared multiple times: ${toJson(
        contextTrailParam
      )}. Using first item.`
    );
    contextTrailParam = contextTrailParam[0];
  }
  if (!contextTrailParam) {
    return { infos: [], hadInvalidInfos: false };
  }
  const { infos, hasInvalidInfos } = parseContextTrail(contextTrailParam);
  return { infos, hasInvalidInfos };
};

function toContextTrailItems(state: RootState, infos: ContextTrailItemInfo[]) {
  const items = map(infos, (info) => toContextTrailItem(state, info));
  // If any entities haven't loaded yet, return empty infos
  return some(items, (item) => !item.connectingEntity) ? [] : items;
}

function toContextTrailItem(
  state: RootState,
  info: ContextTrailItemInfo
): ContextTrailItem {
  const { connectingEntityType, connectingEntityId, polarity } = info;
  const schema = normalizationSchemaByEntityType[connectingEntityType];
  const connectingEntity = denormalize(
    connectingEntityId,
    schema,
    state.entities
  ) as ConnectingEntity;
  return {
    connectingEntityType,
    connectingEntityId,
    connectingEntity,
    polarity,
  } as ContextTrailItem;
}
