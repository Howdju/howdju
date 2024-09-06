import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useParams } from "react-router";
import { denormalize } from "normalizr";

import { api, writQuoteSchema } from "howdju-client-common";

import HowdjuHelmet from "@/Helmet";
import WritQuoteCard from "@/WritQuoteCard";
import { useAppSelector } from "@/hooks";
import { CircularProgress } from "@/components/progress/CircularProgress";
import SingleColumnGrid from "@/components/layout/SingleColumnGrid";
import { Page } from "@/components/layout/Page";

const id = "WritQuotePage";
type Params = {
  writQuoteId: string;
};

/** Displays a WritQuote */
const WritQuotePage = () => {
  const { writQuoteId } = useParams<Params>();

  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(api.fetchWritQuote(writQuoteId));
  }, [dispatch, writQuoteId]);

  const writQuote = denormalize(
    writQuoteId,
    writQuoteSchema,
    useAppSelector((state) => state.entities)
  );
  // const writQuote: WritQuote = useSelector((state: RootState) => get(state.editors, [editorType, editorId]))

  const progress = <CircularProgress id={`${id}-Progress`} />;
  const viewer = writQuote && (
    <WritQuoteCard id={id} writQuote={writQuote} showUrls={true} />
  );
  return (
    <Page>
      <HowdjuHelmet>
        <title>{`WritQuote: &ldquo;${writQuote?.title}&rdquo; — Howdju`}</title>
      </HowdjuHelmet>
      <h1>{writQuote?.title}</h1>
      <SingleColumnGrid>{writQuote ? viewer : progress}</SingleColumnGrid>
    </Page>
  );
};
export default WritQuotePage;
