import React from "react";
import { useDispatch, useSelector } from "react-redux";
import queryString from 'query-string'
import { useHistory, useLocation } from 'react-router';

import { WritQuote } from "howdju-common";

import { editors } from "@/actions";
import WritQuoteEditor from "@/editors/WritQuoteEditor";
import get from "lodash/get";
import { EditorTypes } from "@/reducers/editors";

class Props {
  location: {
    search: string,
  };
}

const id = 'SubmitSourcExcerpt';
const editorType = EditorTypes.WRIT_QUOTE;
const editorId = 'SubmitSourcExcerpt';

/**
 * Prepopulates a SourceExcerpt editor from query parameters.
 *
 * Currently only supports WritQuotes.
 */
const SubmitSourcExcerptPage: React.PureComponent<Props> = () => {

  const history = useHistory();
  const location = useLocation();
  const queryParams = queryString.parse(location.search);
  let writQuote: WritQuote = useSelector((state) => get(state.editors, [editorType, editorId]))
  if (!writQuote) {
    const {
      url,
      description,
      quoteText,
    } = queryParams;

    writQuote = {
      quoteText,
      writ: {
        title: description
      },
      urls: [{ url }]
    }

    const dispatch = useDispatch()
    dispatch(editors.beginEdit(editorType, editorId, writQuote))
  }

  return (
    <div className="md-grid">
      <h1 className="md-cell--12">Create WritQuote</h1>
      <WritQuoteEditor id={id} editorType={editorType} editorId={editorId}
        className="md-cell--12" />
    </div>
  )
};
export default SubmitSourcExcerptPage;
