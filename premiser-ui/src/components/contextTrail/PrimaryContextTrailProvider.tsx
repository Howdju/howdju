import React, { createContext, PropsWithChildren } from "react";
import queryString from "query-string";
import { isArray, isEmpty, map, some } from "lodash";
import { RouteComponentProps } from "react-router";
import { Location } from "history";
import useDeepCompareEffect from "use-deep-compare-effect";
import { denormalize } from "normalizr";

import {
  ContextTrailItem,
  ContextTrailItemInfo,
  parseContextTrail,
  ConnectingEntity,
} from "howdju-common";

import { logger } from "@/logger";
import { useAppDispatch, useAppSelector } from "@/hooks";
import { api } from "@/apiActions";
import { RootState } from "@/setupStore";
import { justificationSchema } from "@/normalizationSchemas";

interface Props extends RouteComponentProps {}

/**
 * Obtains the context trail from the query params and API for the PrimaryContextTrail context.
 */
export function PrimaryContextTrailProvider({
  location,
  children,
}: PropsWithChildren<Props>) {
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
      `contextTrailParam can only appear once, but appeared multiple times: ${contextTrailParam}. Using first item.`
    );
    contextTrailParam = contextTrailParam[0];
  }
  if (!contextTrailParam) {
    return { infos: [], hadInvalidInfos: false };
  }
  const { infos, hasInvalidInfos } = parseContextTrail(contextTrailParam);
  return { infos, hasInvalidInfos };
};

const normalizationSchemaByConnectingEntityType = {
  JUSTIFICATION: justificationSchema,
} as const;

function toContextTrailItems(state: RootState, infos: ContextTrailItemInfo[]) {
  const items = map(infos, (info) => toContextTrailItem(state, info));
  // If any entities havn't loaded yet, return empty infos
  return some(items, (item) => !item.connectingEntity) ? [] : items;
}

function toContextTrailItem(
  state: RootState,
  info: ContextTrailItemInfo
): ContextTrailItem {
  const { connectingEntityType, connectingEntityId, polarity } = info;
  const schema =
    normalizationSchemaByConnectingEntityType[connectingEntityType];
  const connectingEntity = denormalize(
    connectingEntityId,
    schema,
    state.entities
  );
  return {
    connectingEntityType,
    connectingEntityId,
    connectingEntity,
    polarity,
  };
}
