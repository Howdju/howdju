import URLSafeBase64 from "urlsafe-base64";

import cloneDeep from "lodash/cloneDeep";
import get from "lodash/get";
import invert from "lodash/invert";
import last from "lodash/last";
import map from "lodash/map";
import mapKeys from "lodash/mapKeys";

import {
  ContinuationToken,
  Entity,
  JustificationSearchFilters,
  SortDescription,
  SortDirections,
} from "howdju-common";

/** Store the sort continuation properties with single-letter representations to cut down on the size of the payload */
const ContinuationTokenShortPropertyNames = {
  sorts: "s",
  filters: "f",
};
const ContinuationTokenFullPropertyNames = invert(
  ContinuationTokenShortPropertyNames
);
const SortContinuationShortPropertyNames = {
  property: "p",
  direction: "d",
  value: "v",
};
const SortContinuationFullPropertyNames = invert(
  SortContinuationShortPropertyNames
);
/** Shorter than SortDirections so that the continuations tokens are smaller */
const ShortSortDirection = {
  [SortDirections.ASCENDING]: "a",
  [SortDirections.DESCENDING]: "d",
};
const LongSortDirection = invert(ShortSortDirection);

const shortenContinuationInfoSort = (sort) => {
  if (sort.direction) {
    sort.direction = ShortSortDirection[sort.direction];
  }
  const shortSort = mapKeys(
    sort,
    (_value, key) => SortContinuationShortPropertyNames[key]
  );
  return shortSort;
};

const lengthenContinuationInfoSort = (sort) => {
  const longSort = mapKeys(
    sort,
    (_value, key) => SortContinuationFullPropertyNames[key]
  );

  if (longSort.direction) {
    longSort.direction = LongSortDirection[longSort.direction];
  }

  return longSort;
};

export const createContinuationInfo = <E extends Entity>(
  sorts: SortDescription<E>[],
  lastEntity: E,
  filters: { [key in keyof E]: E[key] }
) => {
  const continuationSorts = map(sorts, ({ property, direction }) => {
    const value = lastEntity[property];
    const continuationInfo = {
      property,
      value,
    };
    // Only set the direction if necessary to overcome the default
    if (direction === SortDirections.DESCENDING) {
      continuationInfo.direction = SortDirections.DESCENDING;
    }
    return continuationInfo;
  });
  const continuationInfo = {
    sorts: continuationSorts,
    filters,
  };

  if (continuationInfo.sorts) {
    continuationInfo.sorts = map(
      continuationInfo.sorts,
      shortenContinuationInfoSort
    );
  }
  const shortNameContinuationInfo = mapKeys(
    continuationInfo,
    (value, key) => ContinuationTokenShortPropertyNames[key]
  );

  return shortNameContinuationInfo;
};

export const createNextContinuationToken = (sorts, entities, filters) => {
  const lastEntity = last(entities);
  let nextContinuationToken;
  if (lastEntity) {
    // Everything from the previous token should be fine except we need to update the values
    const nextContinuationInfo = updateContinuationInfo(
      sorts,
      lastEntity,
      filters
    );

    if (nextContinuationInfo.sorts) {
      nextContinuationInfo.sorts = map(
        nextContinuationInfo.sorts,
        shortenContinuationInfoSort
      );
    }
    const shortNextContinuationInfo = mapKeys(
      nextContinuationInfo,
      (value, key) => ContinuationTokenShortPropertyNames[key]
    );

    nextContinuationToken = encodeContinuationToken(shortNextContinuationInfo);
  }
  return nextContinuationToken;
};

export const createContinuationToken = <E extends Entity>(
  sorts: SortDescription<E>[],
  entities: E[],
  filters: { [key in keyof E]: E[key] }
) => {
  const lastEntity = last(entities);
  let continuationToken = null;

  if (lastEntity) {
    const continuationInfos = createContinuationInfo(
      sorts,
      lastEntity,
      filters
    );
    continuationToken = encodeContinuationToken(continuationInfos);
  }
  return continuationToken;
};

export const decodeContinuationToken = (
  continuationToken: ContinuationToken
) => {
  const decoded = URLSafeBase64.decode(continuationToken).toString();
  const continuationInfo = JSON.parse(decoded);

  const fullNameContinuationInfo = mapKeys(
    continuationInfo,
    (_value, key) => ContinuationTokenFullPropertyNames[key]
  );
  if (fullNameContinuationInfo.sorts) {
    fullNameContinuationInfo.sorts = map(
      fullNameContinuationInfo.sorts,
      lengthenContinuationInfoSort
    );
  }

  return fullNameContinuationInfo;
};

export const encodeContinuationToken = (continuationInfo) =>
  URLSafeBase64.encode(Buffer.from(JSON.stringify(continuationInfo)));

export const updateContinuationInfo = (sorts, lastEntity, filters) => {
  const newSorts = map(sorts, (sort) => {
    const nextSortContinuation = cloneDeep(sort);
    nextSortContinuation.value = get(lastEntity, sort.property);
    return nextSortContinuation;
  });

  return {
    sorts: newSorts,
    filters,
  };
};
