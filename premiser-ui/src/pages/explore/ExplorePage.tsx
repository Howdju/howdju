import React, { useEffect } from "react";

import { useAppAllEntitiesSelector, useAppDispatch } from "@/hooks";
import { tagSchema, domainSchema } from "@/normalizationSchemas";
import { Page } from "@/components/layout/Page";
import Link from "@/Link";
import paths from "@/paths";
import { api } from "@/apiActions";

export default function ExplorePage() {
  const dispatch = useAppDispatch();
  useEffect(() => void dispatch(api.fetchExplorePageData()), [dispatch]);

  const { allTags, allDomains } = useAppAllEntitiesSelector({
    allTags: tagSchema,
    allDomains: domainSchema,
  });
  allTags.sort((a, b) => a.name.localeCompare(b.name));
  allDomains.sort();

  return (
    <Page>
      <h1>Tags</h1>
      <ul>
        {allTags.map((t) => (
          <li key={t.name}>
            <Link to={paths.tag(t)}>{t.name}</Link>
          </li>
        ))}
      </ul>
      <h1>Domains</h1>
      <ul>
        {allDomains.map(({ id, domain }) => (
          <li key={id}>
            <Link to={paths.mainSearch(domain)}>{domain}</Link>
          </li>
        ))}
      </ul>
    </Page>
  );
}
