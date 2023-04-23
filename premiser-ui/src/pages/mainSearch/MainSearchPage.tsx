import React, { UIEvent, useEffect } from "react";
import { useDispatch } from "react-redux";
import find from "lodash/find";
import map from "lodash/map";
import { denormalize } from "normalizr";
import { CircularProgress } from "react-md";
import FlipMove from "react-flip-move";

import mainSearcher from "../../mainSearcher";
import PropositionCard from "../../PropositionCard";
import WritCard from "../../WritCard";
import WritQuoteCard from "../../WritQuoteCard";
import { smallCellClasses } from "../../CellList";
import { RootState } from "@/setupStore";
import { api, goto } from "../../actions";
import {
  writsSchema,
  writQuotesSchema,
  propositionsSchema,
  tagsSchema,
} from "../../normalizationSchemas";
import config from "../../config";
import { logger } from "../../logger";
import TagsViewer from "../../TagsViewer";
import { PropositionOut, WritOut, WritQuoteOut } from "howdju-common";
import { useAppSelector } from "@/hooks";
import { useLocation } from "react-router";

export default function MainSearchPage() {
  const location = useLocation();
  const dispatch = useDispatch();

  const searchText = mainSearcher.mainSearchText(location);

  useEffect(() => {
    dispatch(api.fetchMainSearchResults(searchText));
  }, [dispatch, searchText]);

  const isFetching = useAppSelector((state) => state.mainSearchPage.isFetching);
  const results = useAppSelector((state) => state.mainSearchPage.results);
  const entities = useAppSelector((state) => state.entities);

  const {
    tags,
    propositionTexts,
    writQuoteQuoteTexts,
    writQuoteUrls,
    writTitles,
  } = denormalizeResults(results, entities);

  const goToTag = (tagName: string, _index: number, _event: UIEvent) => {
    const tag = find(tags, (t) => t.name === tagName);
    if (!tag) {
      logger.warn(`Missing tag for ${tagName}`);
      return;
    }
    dispatch(goto.tag(tag));
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
        {map(propositionTexts, toPropositionCard)}
      </FlipMove>
      {!isFetching && propositionTexts.length < 1 && noResults}

      <h2 className="md-cell md-cell--12">Writs</h2>
      <FlipMove
        className="md-cell md-cell--12 md-grid md-grid--card-list--tablet"
        {...config.ui.flipMove}
      >
        {map(writTitles, toWritCard)}
      </FlipMove>
      {!isFetching && writTitles.length < 1 && noResults}

      <h2 className="md-cell md-cell--12">
        Writ quotes (text appears within quote)
      </h2>
      <FlipMove
        className="md-cell md-cell--12 md-grid md-grid--card-list--tablet"
        {...config.ui.flipMove}
      >
        {map(writQuoteQuoteTexts, toWritQuoteCard)}
      </FlipMove>
      {!isFetching && writQuoteQuoteTexts.length < 1 && noResults}

      <h2 className="md-cell md-cell--12">
        Writ quotes (text appears within URL)
      </h2>
      <FlipMove
        className="md-cell md-cell--12 md-grid md-grid--card-list--tablet"
        {...config.ui.flipMove}
      >
        {map(writQuoteUrls, toWritQuoteWithUrlsCard)}
      </FlipMove>
      {!isFetching && writQuoteUrls.length < 1 && noResults}
    </div>
  );
}

function denormalizeResults(
  results: RootState["mainSearchPage"]["results"],
  entities: RootState["entities"]
) {
  const {
    tags,
    propositionTexts,
    writQuoteQuoteTexts,
    writQuoteUrls,
    writTitles,
  } = results;
  return {
    tags: denormalize(tags, tagsSchema, entities),
    propositionTexts: denormalize(
      propositionTexts,
      propositionsSchema,
      entities
    ),
    writQuoteQuoteTexts: denormalize(
      writQuoteQuoteTexts,
      writQuotesSchema,
      entities
    ),
    writQuoteUrls: denormalize(writQuoteUrls, writQuotesSchema, entities),
    writTitles: denormalize(writTitles, writsSchema, entities),
  };
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

function toWritQuoteCard(writQuote: WritQuoteOut) {
  const id = `writ-quote-card-${writQuote.id}`;
  return (
    <WritQuoteCard
      writQuote={writQuote}
      id={id}
      key={id}
      className={smallCellClasses}
    />
  );
}

function toWritQuoteWithUrlsCard(writQuote: WritQuoteOut) {
  const id = `writ-quote-card-${writQuote.id}`;
  return (
    <WritQuoteCard
      writQuote={writQuote}
      id={id}
      key={id}
      className={smallCellClasses}
      showUrls={true}
    />
  );
}

function toWritCard(writ: WritOut) {
  const id = `writ-card-${writ.id}`;
  return <WritCard writ={writ} id={id} key={id} className={smallCellClasses} />;
}
