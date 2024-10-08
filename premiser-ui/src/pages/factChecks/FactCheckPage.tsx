import React from "react";
import { useLocation } from "react-router";
import queryString from "query-string";
import useDeepCompareEffect from "use-deep-compare-effect";
import { isArray } from "lodash";
import { GridCell } from "@react-md/utils";

import { EntityId } from "howdju-common";
import {
  appearancesSchema,
  sourcesSchema,
  urlsSchema,
  usersSchema,
} from "howdju-client-common";

import { useAppDispatch, useAppEntitySelector, useAppSelector } from "@/hooks";
import AppearanceCard from "@/pages/appearances/AppearanceCard";
import HowdjuHelmet from "@/Helmet";
import page from "./factCheckPageSlice";
import { CircularProgress } from "@/components/progress/CircularProgress";
import { appearanceCardColSpans } from "@/components/listEntities/ListEntitiesWidget";
import { FlipGrid } from "@/components/layout/FlipGrid";
import { Page } from "@/components/layout/Page";

/**
 * A page displaying Appearances that are part of a FactCheck.
 *
 * A FactCheck is all the Appearances a set of users has created where:
 *
 * - The Appearance's MediaExcerpt matches any URL or Source parameterizing the fact check, and
 * - The users have confirmed the Appearance's apparition.
 */
export default function FactCheckPage() {
  const location = useLocation();
  const queryParams = queryString.parse(location.search);
  let { userIds, urlIds, sourceIds } = queryParams;
  if (!userIds) {
    return (
      <div>
        <code>userIds</code> query string parameter is required.
      </div>
    );
  }
  if (!urlIds && !sourceIds) {
    return (
      <div>
        <code>urlIds</code> or <code>sourceIds</code> query string parameter is
        required.
      </div>
    );
  }
  userIds = isArray(userIds) ? userIds : userIds?.split(",") ?? [];
  urlIds = isArray(urlIds) ? urlIds : urlIds?.split(",") ?? [];
  sourceIds = isArray(sourceIds) ? sourceIds : sourceIds?.split(",") ?? [];

  return (
    <ValidParamsFactCheckPage
      userIds={userIds}
      urlIds={urlIds}
      sourceIds={sourceIds}
    />
  );
}

function ValidParamsFactCheckPage({
  userIds,
  urlIds,
  sourceIds,
}: {
  userIds: EntityId[];
  urlIds: EntityId[];
  sourceIds: EntityId[];
}) {
  const dispatch = useAppDispatch();
  useDeepCompareEffect(() => {
    dispatch(page.fetchFactCheck({ userIds, urlIds, sourceIds }));
  }, [dispatch, userIds, urlIds, sourceIds]);

  const { appearanceIds } = useAppSelector((state) => state.factCheckPage);

  const appearances = useAppEntitySelector(appearanceIds, appearancesSchema);
  const users = useAppEntitySelector(userIds, usersSchema);
  const urls = useAppEntitySelector(urlIds, urlsSchema);
  const sources = useAppEntitySelector(sourceIds, sourcesSchema);
  const title = `FactCheck`;

  if (
    users.some((user) => !user) ||
    urls.some((url) => !url) ||
    sources.some((source) => !source)
  ) {
    return <CircularProgress id="fact-check-page-progress" />;
  }

  return (
    <Page>
      <HowdjuHelmet>
        <title>{title} — Howdju</title>
      </HowdjuHelmet>

      <h1>{title}</h1>

      <h2>Users</h2>
      <ul>
        {users.map((user) => (
          <li key={user.id}>
            {user.longName} {user.username && <>({user.username})</>}
          </li>
        ))}
      </ul>
      <h2>URLs</h2>
      <ul>
        {urls.map((url) => (
          <li key={url.id}>{url.url}</li>
        ))}
      </ul>
      <h2>Sources</h2>
      <ul>
        {sources.map((source) => (
          <li key={source.id}>{source.description}</li>
        ))}
      </ul>

      <h2>Appearances</h2>
      <FlipGrid>
        {appearances.map((appearance) => (
          <GridCell key={appearance.id} {...appearanceCardColSpans}>
            <AppearanceCard id={appearance.id} appearance={appearance} />
          </GridCell>
        ))}
      </FlipGrid>
    </Page>
  );
}
