import React, { useEffect } from "react"
import { useDispatch } from "react-redux"
import { useParams } from "react-router"
import { denormalize } from "normalizr"
import { CircularProgress } from "react-md"

import { api } from "@/actions"
import HowdjuHelmet from "@/Helmet"
import { writQuoteSchema } from "@/normalizationSchemas"
import { combineIds } from "@/viewModels"
import WritQuoteCard from "@/WritQuoteCard"
import { useAppSelector } from "@/hooks"

const id = 'WritQuotePage'
type Params = {
  writQuoteId: string;
};

/** Displays a WritQuote */
const WritQuotePage = () => {

  const {writQuoteId} = useParams<Params>()
  const editorId = combineIds('write-quote', writQuoteId)
  const suggestionsKey = 'writ-quote-page'

  const dispatch = useDispatch()
  useEffect(() => {
    dispatch(api.fetchWritQuote(writQuoteId))
  }, [dispatch, writQuoteId])

  const writQuote = denormalize(
    writQuoteId, writQuoteSchema, useAppSelector(state => state.entities))
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
}
export default WritQuotePage
