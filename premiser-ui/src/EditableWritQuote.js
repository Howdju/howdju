import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { CircularProgress } from "react-md";
import get from "lodash/get";

import { EditorTypes } from "./reducers/editors";
import WritQuoteViewer from "./WritQuoteViewer";
import WritQuoteEditor from "./WritQuoteEditor";
import ExpandableChildContainer from "./ExpandableChildContainer";

class EditableWritQuote extends Component {
  render() {
    const {
      id,
      editorId,
      writQuote,
      suggestionsKey,
      isFetching,
      isEditing,
      showStatusText,
      showUrls,
      onClickUrl,
      ...rest
    } = this.props;

    const editor = () => (
      <WritQuoteEditor
        {...rest}
        id={id}
        editorId={editorId}
        suggestionsKey={suggestionsKey}
      />
    );

    const viewer = (
      <ExpandableChildContainer
        {...rest}
        expandableChildComponent={WritQuoteViewer}
        widgetId={id}
        key={id}
        writQuote={writQuote}
        showStatusText={showStatusText}
        showUrls={showUrls}
        onClickUrl={onClickUrl}
      />
    );
    const progress = <CircularProgress id={`${id}-Progress`} />;

    return isEditing ? editor() : isFetching ? progress : viewer;
  }
}
EditableWritQuote.propTypes = {
  /** Required for the CircularProgress */
  id: PropTypes.string.isRequired,
  writQuote: PropTypes.object.isRequired,
  /** Identifies the editor's state */
  editorId: PropTypes.string,
  /** If omitted, no autocomplete */
  suggestionsKey: PropTypes.string,
};

const mapStateToProps = (state, ownProps) => {
  const editorId = ownProps.editorId;
  const { editEntity } = editorId
    ? get(state.editors, [EditorTypes.WRIT_QUOTE, editorId], {})
    : {};

  const isEditing = !!editEntity;
  return {
    isEditing,
  };
};

export default connect(mapStateToProps)(EditableWritQuote);
