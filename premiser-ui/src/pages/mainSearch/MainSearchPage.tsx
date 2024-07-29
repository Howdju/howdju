import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useLocation } from "react-router";
import { GridCell } from "@react-md/utils";

import {
  MediaExcerptView,
  PersorgOut,
  PropositionOut,
  SourceOut,
  TagOut,
} from "howdju-common";

import { CircularProgress } from "@/components/progress/CircularProgress";
import mainSearcher from "../../mainSearcher";
import PropositionCard from "../../PropositionCard";
import { api, goto } from "../../actions";
import { mainSearchResultSchema } from "../../normalizationSchemas";
import TagsViewer from "@/components/tags/TagsViewer";
import { useAppEntitySelector, useAppSelector } from "@/hooks";
import SourceEntityCard from "@/components/sources/SourceEntityCard";
import MediaExcerptCard from "@/components/mediaExcerpts/MediaExcerptCard";
import PersorgEntityCard from "@/PersorgEntityCard";
import { TagOutOrInput } from "@/components/tags/TagsControl";
import {
  persorgCardColSpans,
  mediaExcerptCardColSpans,
  sourceCardColSpans,
  propositionCardColSpans,
} from "@/components/listEntities/ListEntitiesWidget";
import { FlipGrid } from "@/components/layout/FlipGrid";
import { Page } from "@/components/layout/Page";

export default function MainSearchPage() {
  const location = useLocation();
  const dispatch = useDispatch();

  const searchText = mainSearcher.mainSearchText(location);

  useEffect(() => {
    dispatch(api.fetchMainSearchResults(searchText));
  }, [dispatch, searchText]);

  const { isFetching, normalizedResult } = useAppSelector(
    (state) => state.mainSearchPage
  );

  const { mediaExcerpts, persorgs, propositions, sources, tags } =
    useAppEntitySelector(normalizedResult, mainSearchResultSchema);

  const goToTag = (tag: TagOutOrInput) => {
    if (!tag.id) {
      return;
    }
    dispatch(goto.tag(tag as TagOut));
  };

  const loading = <CircularProgress id="progress" />;
  const noResults = <div>No results.</div>;

  return (
    <Page id="main-search-page">
      <h1>Search results for: &ldquo;{searchText}&rdquo;</h1>
      {isFetching && loading}

      <h2>Tags</h2>
      {tags.length > 0 && (
        <TagsViewer
          id="main-search-tags-viewer"
          mode="view"
          tags={tags}
          canHide={false}
          votable={false}
          onClickTag={goToTag}
        />
      )}
      {!isFetching && tags.length < 1 && noResults}

      <h2>Propositions</h2>
      <FlipGrid>
        {propositions.map((p) => (
          <GridCell key={p.id} {...propositionCardColSpans}>
            {toPropositionCard(p)}
          </GridCell>
        ))}
      </FlipGrid>
      {!isFetching && propositions.length < 1 && noResults}

      <h2>Sources</h2>
      <FlipGrid>
        {sources.map((s) => (
          <GridCell key={s.id} {...sourceCardColSpans}>
            {toSourceCard(s)}
          </GridCell>
        ))}
      </FlipGrid>
      {!isFetching && sources.length < 1 && noResults}

      <h2>Persorgs</h2>
      <FlipGrid>
        {persorgs.map((p) => (
          <GridCell key={p.id} {...persorgCardColSpans}>
            {toPersorgCard(p)}
          </GridCell>
        ))}
      </FlipGrid>
      {!isFetching && persorgs.length < 1 && noResults}

      <h2>Media excerpts</h2>
      <FlipGrid>
        {mediaExcerpts.map((me) => (
          <GridCell key={me.id} {...mediaExcerptCardColSpans}>
            {toMediaExcerptCard(me)}
          </GridCell>
        ))}
      </FlipGrid>
      {!isFetching && mediaExcerpts.length < 1 && noResults}
    </Page>
  );
}

function toPropositionCard(proposition: PropositionOut) {
  const id = `proposition-card-${proposition.id}`;
  return <PropositionCard proposition={proposition} id={id} key={id} />;
}

function toSourceCard(source: SourceOut) {
  const id = `source-card-${source.id}`;
  return <SourceEntityCard source={source} id={id} key={id} />;
}

function toMediaExcerptCard(mediaExcerpt: MediaExcerptView) {
  const id = `media-excerpt-card-${mediaExcerpt.id}`;
  return <MediaExcerptCard mediaExcerpt={mediaExcerpt} id={id} key={id} />;
}

function toPersorgCard(persorg: PersorgOut) {
  const id = `persorg-card-${persorg.id}`;
  return <PersorgEntityCard persorg={persorg} id={id} key={id} />;
}
