import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { Button, CircularProgress } from "react-md";
import get from "lodash/get";

import { makeJustificationEditModel } from "howdju-client-common";

import { editors, mapActionCreatorGroupToDispatchToProps } from "./actions";
import { EditorTypes } from "./reducers/editors";
import t, {
  CANCEL_BUTTON_LABEL,
  EDIT_ENTITY_SUBMIT_BUTTON_LABEL,
} from "./texts";
import {
  combineIds,
  translateJustificationErrorsFromFormInput,
} from "./viewModels";
import JustificationEditorFields from "./JustificationEditorFields";

class JustificationEditor extends Component {
  onPropertyChange = (properties) => {
    this.props.editors.propertyChange(
      JustificationEditor.editorType,
      this.props.editorId,
      properties
    );
  };

  onAddUrl = () => {
    this.props.editors.addUrl(
      JustificationEditor.editorType,
      this.props.editorId
    );
  };

  onRemoveUrl = (url, index) => {
    this.props.editors.removeUrl(
      JustificationEditor.editorType,
      this.props.editorId,
      url,
      index
    );
  };

  onAddPropositionCompoundAtom = () => {
    this.props.editors.addPropositionCompoundAtom(
      JustificationEditor.editorType,
      this.props.editorId
    );
  };

  onRemovePropositionCompoundAtom = (atom, index) => {
    this.props.editors.removePropositionCompoundAtom(
      JustificationEditor.editorType,
      this.props.editorId,
      atom,
      index
    );
  };

  onSubmit = (event) => {
    if (!this.props.onSubmit) {
      event.preventDefault();
      this.props.editors.commitEdit(
        JustificationEditor.editorType,
        this.props.editorId
      );
    } else {
      this.props.onSubmit(event);
    }
  };

  onCancelEdit = () => {
    this.props.editors.cancelEdit(
      JustificationEditor.editorType,
      this.props.editorId
    );
  };

  render() {
    const { id, editorState, doShowButtons, ...rest } = this.props;
    delete rest.editors;
    delete rest.editorId;
    delete rest.onSubmit;

    const justification =
      editorState.editEntity || makeJustificationEditModel();
    const { errors, isSaving } = editorState;
    const justificationErrors =
      translateJustificationErrorsFromFormInput(justification, errors) ||
      errors;

    const buttons = [
      <Button
        flat
        key="cancelButton"
        children={t(CANCEL_BUTTON_LABEL)}
        onClick={this.onCancelEdit}
      />,
      <Button
        flat
        primary
        key="submitButton"
        type="submit"
        children={t(EDIT_ENTITY_SUBMIT_BUTTON_LABEL)}
        disabled={isSaving}
      />,
    ];

    return (
      <form className="justification-editor" onSubmit={this.onSubmit}>
        <JustificationEditorFields
          {...rest}
          justification={justification}
          id={combineIds(id, "editor-fields")}
          onPropertyChange={this.onPropertyChange}
          onAddUrl={this.onAddUrl}
          onRemoveUrl={this.onRemoveUrl}
          onAddPropositionCompoundAtom={this.onAddPropositionCompoundAtom}
          onRemovePropositionCompoundAtom={this.onRemovePropositionCompoundAtom}
          onSubmit={this.onSubmit}
          errors={justificationErrors}
        />
        {isSaving && <CircularProgress key="progress" id="progress" />}
        {doShowButtons && buttons}
      </form>
    );
  }
}
JustificationEditor.propTypes = {
  /** Identifies the editor's state */
  editorId: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  /** If omitted, no autocomplete */
  suggestionsKey: PropTypes.string,
  /** If present, defers submits to this function */
  onSubmit: PropTypes.func,
  doShowButtons: PropTypes.bool,
  disabled: PropTypes.bool,
  onKeyDown: PropTypes.func,
};
JustificationEditor.defaultProps = {
  doShowButtons: true,
};
JustificationEditor.editorType = EditorTypes.NEW_JUSTIFICATION;

const mapStateToProps = (state, ownProps) => {
  const editorState =
    get(state.editors, [EditorTypes.NEW_JUSTIFICATION, ownProps.editorId]) ||
    {};
  return {
    editorState,
  };
};

export default connect(
  mapStateToProps,
  mapActionCreatorGroupToDispatchToProps({
    editors,
  })
)(JustificationEditor);
