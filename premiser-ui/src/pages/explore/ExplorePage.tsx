import React, { useEffect } from "react";

import { useAppAllEntitiesSelector, useAppDispatch } from "@/hooks";
import { tagSchema, domainSchema } from "@/normalizationSchemas";
import { Page } from "@/components/layout/Page";
import { api } from "@/apiActions";
import { TagOutOrInput } from "@/components/tags/TagsControl";
import TagsViewer from "@/components/tags/TagsViewer";
import { goto } from "@/actions";
import { TagOut } from "howdju-common";
import { ItemGrid } from "@/components/itemGrid/ItemGrid";
import { smallCardColSpans } from "@/components/listEntities/ListEntitiesWidget";
import DomainCard from "@/entities/domain/DomainCard";

export default function ExplorePage() {
  const dispatch = useAppDispatch();
  useEffect(() => void dispatch(api.fetchExplorePageData()), [dispatch]);

  const { allTags, allDomains } = useAppAllEntitiesSelector({
    allTags: tagSchema,
    allDomains: domainSchema,
  });
  allTags.sort((a, b) => a.name.localeCompare(b.name));
  allDomains.sort();

  function goToTag(tag: TagOutOrInput) {
    if (!tag.id) {
      return;
    }
    dispatch(goto.tag(tag as TagOut));
  }

  return (
    <Page>
      <h1>Tags</h1>
      {allTags.length > 0 ? (
        <TagsViewer
          id="explore-page-tags-viewer"
          mode="view"
          tags={allTags}
          canHide={false}
          votable={false}
          onClickTag={goToTag}
        />
      ) : (
        "No tags"
      )}
      <h1>Domains</h1>
      <ItemGrid
        id="explore-page-domain-grid"
        items={allDomains.map((domain) => (
          <DomainCard key={domain.id} domain={domain} />
        ))}
        itemColSpans={smallCardColSpans}
      />
    </Page>
  );
}
