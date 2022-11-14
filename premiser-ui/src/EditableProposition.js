import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { CircularProgress } from "react-md";
import get from "lodash/get";

import { isTruthy } from "howdju-common";

import { EditorTypes } from "./reducers/editors";
import PropositionViewer from "./PropositionViewer";
import PropositionEditor from "./PropositionEditor";

class EditableProposition extends Component {
  render() {
    const {
      id,
      textId,
      editorId,
      proposition,
      suggestionsKey,
      isFetching,
      isEditing,
      showStatusText,
      contextTrailItems,
      showJustificationCount,
      // ignore
      dispatch,
      ...rest
    } = this.props;

    // lazy because editorId may not be available
    const editor = () => (
      <PropositionEditor
        {...rest}
        editorId={editorId}
        id={id}
        textId={textId}
        suggestionsKey={suggestionsKey}
        disabled={isFetching}
      />
    );

    const viewer = (
      <PropositionViewer
        {...rest}
        id={id}
        proposition={proposition}
        showStatusText={showStatusText}
        contextTrailItems={contextTrailItems}
        showJustificationCount={showJustificationCount}
      />
    );

    const progress = <CircularProgress id={`${id}--loading`} />;

    return isEditing ? editor() : !proposition ? progress : viewer;
  }
}
EditableProposition.propTypes = {
  /** Required for the CircularProgress */
  id: PropTypes.string.isRequired,
  /** Identifies the editor's state */
  editorId: PropTypes.string,
  /** If omitted, no autocomplete */
  suggestionsKey: PropTypes.string,
  proposition: PropTypes.object,
};
EditableProposition.defaultProps = {
  showJustificationCount: true,
};

const mapStateToProps = (state, ownProps) => {
  const editorId = ownProps.editorId;
  const { editEntity, isFetching } = editorId
    ? get(state.editors, [EditorTypes.PROPOSITION, editorId], {})
    : {};
  const isEditing = isTruthy(editEntity);
  return {
    isFetching,
    isEditing,
  };
};

export default connect(mapStateToProps)(EditableProposition);
