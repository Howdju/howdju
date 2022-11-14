import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { Button, CircularProgress, CardActions, CardText } from "react-md";
import get from "lodash/get";

import { editors, mapActionCreatorGroupToDispatchToProps } from "./actions";
import { EditorTypes } from "./reducers/editors";
import PropositionEditorFields from "./PropositionEditorFields";
import { CANCEL_BUTTON_LABEL, EDIT_ENTITY_SUBMIT_BUTTON_LABEL } from "./texts";
import t from "./texts";

class PropositionEditor extends Component {
  onPropertyChange = (properties) => {
    this.props.editors.propertyChange(
      PropositionEditor.editorType,
      this.props.editorId,
      properties
    );
  };

  onSubmit = (event) => {
    event.preventDefault();
    this.props.editors.commitEdit(
      PropositionEditor.editorType,
      this.props.editorId
    );
  };

  onCancelEdit = () => {
    this.props.editors.cancelEdit(
      PropositionEditor.editorType,
      this.props.editorId
    );
  };

  render() {
    const {
      id,
      textId,
      suggestionsKey,
      editorState: { errors, editEntity, isFetching, isSaving },
      // ignore
      editors,
      editorId,
      ...rest
    } = this.props;

    const inProgress = isFetching || isSaving;

    return (
      <form onSubmit={this.onSubmit}>
        <CardText>
          <PropositionEditorFields
            {...rest}
            id={id}
            textId={textId}
            proposition={editEntity}
            disabled={isSaving}
            suggestionsKey={suggestionsKey}
            onPropertyChange={this.onPropertyChange}
            onSubmit={this.onSubmit}
            errors={errors}
          />
        </CardText>
        <CardActions>
          {inProgress && <CircularProgress key="progress" id="progress" />}
          <Button
            flat
            key="cancelButton"
            children={t(CANCEL_BUTTON_LABEL)}
            onClick={this.onCancelEdit}
            disabled={inProgress}
          />
          <Button
            raised
            primary
            key="submitButton"
            type="submit"
            children={t(EDIT_ENTITY_SUBMIT_BUTTON_LABEL)}
            disabled={inProgress}
          />
        </CardActions>
      </form>
    );
  }
}
PropositionEditor.propTypes = {
  id: PropTypes.string.isRequired,
  /** Identifies the editor's state */
  editorId: PropTypes.string.isRequired,
  /** If omitted, no autocomplete */
  suggestionsKey: PropTypes.string,
  disabled: PropTypes.bool,
};
PropositionEditor.editorType = EditorTypes.PROPOSITION;

const mapStateToProps = (state, ownProps) => {
  const editorState = get(
    state.editors,
    [PropositionEditor.editorType, ownProps.editorId],
    {}
  );
  return {
    editorState,
  };
};

export default connect(
  mapStateToProps,
  mapActionCreatorGroupToDispatchToProps({
    editors,
  })
)(PropositionEditor);
