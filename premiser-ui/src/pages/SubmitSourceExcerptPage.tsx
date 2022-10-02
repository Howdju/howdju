import React from "react";
import { useDispatch, useSelector } from "react-redux";
import queryString from 'query-string'
import {useLocation} from 'react-router';

import {Url, WritQuote} from "howdju-common";

import { editors } from "@/actions";
import WritQuoteEditor from "@/editors/WritQuoteEditor";
import get from "lodash/get";
import { EditorTypes } from "@/reducers/editors";
import { RootState } from "@/store";
import { isArray } from "lodash";
import HowdjuHelmet from "@/Helmet";
import t, { CREATE_ENTITY_SUBMIT_BUTTON_LABEL } from "@/texts";

const id = 'SubmitSourcExcerpt';
const editorType = EditorTypes.WRIT_QUOTE;
const editorId = 'SubmitSourcExcerpt';

/**
 * Prepopulates a SourceExcerpt editor from query parameters.
 *
 * Currently only supports WritQuotes.
 */
const SubmitSourcExcerptPage = () => {

  const location = useLocation();
  const queryParams = queryString.parse(location.search);
  let writQuote: WritQuote = useSelector((state: RootState) => get(state.editors, [editorType, editorId]))

  const errors = [];

  if (!writQuote) {
    let {
      quoteText,
      description,
      url,
    } = queryParams;

    if (isArray(quoteText)) {
      errors.push('Can only submit one quote. Extras discarded.');
      // If multiple query parameters are defined, the array must have at least two elements.
      quoteText = quoteText[0];
    }
    if (isArray(description)) {
      errors.push('Can only submit one description. Extras discarded.');
      // If multiple query parameters are defined, the array must have at least two elements.
      description = description[0];
    }

    quoteText = quoteText || '';
    description = description || '';
    const urls = isArray(url) ? url.map(u => new Url(u)) : [new Url(url || '')];

    writQuote = {
      quoteText,
      writ: {
        title: description
      },
      urls,
    }

    const dispatch = useDispatch()
    dispatch(editors.beginEdit(editorType, editorId, writQuote))
  }

  return (
    <div className="md-grid">
      <HowdjuHelmet>
        <title>Submit Source Excerpt — Howdju</title>
      </HowdjuHelmet>
      <h1 className="md-cell--12">Create WritQuote</h1>
      <WritQuoteEditor id={id} editorType={editorType} editorId={editorId}
        className="md-cell--12" submitButtonText={t(CREATE_ENTITY_SUBMIT_BUTTON_LABEL)} />
    </div>
  )
};
export default SubmitSourcExcerptPage;
