import React, { useEffect } from "react";

import { TagOut } from "howdju-common";
import { domainSchema, tagSchema } from "howdju-client-common";

import { goto } from "@/actions";
import { ItemGrid } from "@/components/itemGrid/ItemGrid";
import { Page } from "@/components/layout/Page";
import { smallCardColSpans } from "@/components/listEntities/ListEntitiesWidget";
import { CircularProgress } from "@/components/progress/CircularProgress";
import { TagOutOrInput } from "@/components/tags/TagsControl";
import TagsViewer from "@/components/tags/TagsViewer";
import DomainCard from "@/entities/domain/DomainCard";
import ErrorMessages from "@/ErrorMessages";
import Helmet from "@/Helmet";
import {
  useAppAllEntitiesSelector,
  useAppDispatch,
  useAppSelector,
} from "@/hooks";
import explorePage from "./explorePageSlice";
import { TextField } from "@/components/text/TextField";

export default function ExplorePage() {
  const dispatch = useAppDispatch();
  useEffect(() => void dispatch(explorePage.fetchData()), [dispatch]);
  const [domainFilter, setDomainFilter] = React.useState("");

  const { allTags, allDomains } = useAppAllEntitiesSelector({
    allTags: tagSchema,
    allDomains: domainSchema,
  });
  allTags.sort((a, b) => a.name.localeCompare(b.name));
  allDomains.sort();
  const filteredDomains = domainFilter
    ? allDomains.filter(({ domain }) =>
        domain.toLowerCase().includes(domainFilter.toLowerCase())
      )
    : allDomains;

  function goToTag(tag: TagOutOrInput) {
    if (!tag.id) {
      return;
    }
    dispatch(goto.tag(tag as TagOut));
  }

  const { isFetching, didError } = useAppSelector((state) => state.explorePage);

  return (
    <Page>
      <Helmet>
        <title>Explore — Howdju</title>
      </Helmet>

      <h1>Explore</h1>

      {isFetching && <CircularProgress id="explore-page-fetch-progress" />}
      {didError && <ErrorMessages errors={["Failed to load data"]} />}

      <h2>Tags</h2>
      {allTags.length > 0 && (
        <TagsViewer
          id="explore-page-tags-viewer"
          mode="view"
          tags={allTags}
          canHide={false}
          votable={false}
          onClickTag={goToTag}
        />
      )}
      {allTags.length == 0 && !isFetching && "No tags"}

      <h2>Domains</h2>
      <TextField
        id="explore-page-domain-filter"
        name="domainFilter"
        label="Filter domains"
        value={domainFilter}
        onPropertyChange={({ domainFilter }) => setDomainFilter(domainFilter)}
      />
      <ItemGrid
        id="explore-page-domain-grid"
        items={filteredDomains.map((domain) => (
          <DomainCard key={domain.id} domain={domain} />
        ))}
        itemColSpans={smallCardColSpans}
      />
      {allDomains.length !== 0 &&
        filteredDomains.length == 0 &&
        !!domainFilter &&
        "No matching domains"}
      {allDomains.length === 0 && !isFetching && "No domains"}
    </Page>
  );
}
