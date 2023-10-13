import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { map } from "lodash";
import FlipMove from "react-flip-move";
import { useLocation } from "react-router";

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
import { smallCellClasses } from "../../CellList";
import { api, goto } from "../../actions";
import { mainSearchResultSchema } from "../../normalizationSchemas";
import config from "../../config";
import TagsViewer from "../../TagsViewer";
import { useAppEntitySelector, useAppSelector } from "@/hooks";
import SourceEntityCard from "@/components/sources/SourceEntityCard";
import MediaExcerptCard from "@/components/mediaExcerpts/MediaExcerptCard";
import PersorgEntityCard from "@/PersorgEntityCard";
import { TagOutOrInput } from "@/TagsControl";

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

  const loading = (
    <CircularProgress id="progress" className="md-cell md-cell--12" />
  );
  const noResults = <div className="md-cell md-cell--12">No results.</div>;

  return (
    <div id="main-search-page" className="md-grid">
      <h1 className="md-cell md-cell--12">
        Search results for: &ldquo;{searchText}&rdquo;
      </h1>
      {isFetching && loading}

      <h2 className="md-cell md-cell--12">Tags</h2>
      <FlipMove
        className="md-cell md-cell--12 md-grid md-grid--card-list--tablet"
        {...config.ui.flipMove}
      >
        {tags.length > 0 && (
          <TagsViewer
            tags={tags}
            canHide={false}
            votable={false}
            onClickTag={goToTag}
          />
        )}
      </FlipMove>
      {!isFetching && tags.length < 1 && noResults}

      <h2 className="md-cell md-cell--12">Propositions</h2>
      <FlipMove
        className="md-cell md-cell--12 md-grid md-grid--card-list--tablet"
        {...config.ui.flipMove}
      >
        {map(propositions, toPropositionCard)}
      </FlipMove>
      {!isFetching && propositions.length < 1 && noResults}

      <h2 className="md-cell md-cell--12">Sources</h2>
      <FlipMove
        className="md-cell md-cell--12 md-grid md-grid--card-list--tablet"
        {...config.ui.flipMove}
      >
        {map(sources, toSourceCard)}
      </FlipMove>
      {!isFetching && sources.length < 1 && noResults}

      <h2 className="md-cell md-cell--12">Persorgs</h2>
      <FlipMove
        className="md-cell md-cell--12 md-grid md-grid--card-list--tablet"
        {...config.ui.flipMove}
      >
        {map(persorgs, toPersorgCard)}
      </FlipMove>
      {!isFetching && persorgs.length < 1 && noResults}

      <h2 className="md-cell md-cell--12">Media excerpts</h2>
      <FlipMove
        className="md-cell md-cell--12 md-grid md-grid--card-list--tablet"
        {...config.ui.flipMove}
      >
        {map(mediaExcerpts, toMediaExcerptCard)}
      </FlipMove>
      {!isFetching && mediaExcerpts.length < 1 && noResults}
    </div>
  );
}

function toPropositionCard(proposition: PropositionOut) {
  const id = `proposition-card-${proposition.id}`;
  return (
    <PropositionCard
      proposition={proposition}
      id={id}
      key={id}
      className={smallCellClasses}
    />
  );
}

function toSourceCard(source: SourceOut) {
  const id = `source-card-${source.id}`;
  return (
    <SourceEntityCard
      source={source}
      id={id}
      key={id}
      className={smallCellClasses}
    />
  );
}

function toMediaExcerptCard(mediaExcerpt: MediaExcerptView) {
  const id = `media-excerpt-card-${mediaExcerpt.id}`;
  return (
    <MediaExcerptCard
      mediaExcerpt={mediaExcerpt}
      id={id}
      key={id}
      className={smallCellClasses}
    />
  );
}

function toPersorgCard(persorg: PersorgOut) {
  const id = `persorg-card-${persorg.id}`;
  return (
    <PersorgEntityCard
      persorg={persorg}
      id={id}
      key={id}
      className={smallCellClasses}
    />
  );
}
