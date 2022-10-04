import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router";
import { denormalize } from "normalizr";
import { CircularProgress } from "react-md";

import { api } from "@/actions";
import HowdjuHelmet from "@/Helmet";
import { writQuoteSchema } from "@/normalizationSchemas";
import { RootState } from "@/store";
import { combineIds } from "@/viewModels";
import WritQuoteCard from "@/WritQuoteCard";

const id = 'WritQuotePage';
type Params = {
  writQuoteId: string;
};

/** Displays a WritQuote */
const WritQuotePage = () => {

  const {writQuoteId} = useParams<Params>()
  const editorId = combineIds('write-quote', writQuoteId);
  const suggestionsKey = 'writ-quote-page'

  const dispatch = useDispatch()
  useEffect(() => {
    dispatch(api.fetchWritQuote(writQuoteId))
  }, [writQuoteId])

  const writQuote = denormalize(
    writQuoteId, writQuoteSchema, useSelector((state: RootState) => state.entities))
  // const writQuote: WritQuote = useSelector((state: RootState) => get(state.editors, [editorType, editorId]))

  const progress = <CircularProgress id={`${id}-Progress`} />
  const viewer = writQuote && (
    <WritQuoteCard
        id={id}
        writQuote={writQuote}
        showUrls={true}
        editorId={editorId}
        suggestionsKey={suggestionsKey}
        className="md-cell--12"
        editorCommitBehavior={'JustCommit'}
      />
  )
  return (
    <div className="md-grid">
      <HowdjuHelmet>
        <title>{`WritQuote: &ldquo;${writQuote?.title}&rdquo; — Howdju`}</title>
      </HowdjuHelmet>
      <h1 className="md-cell--12">{writQuote?.title}</h1>
      {writQuote ? viewer : progress}
    </div>
  )
};
export default WritQuotePage;
