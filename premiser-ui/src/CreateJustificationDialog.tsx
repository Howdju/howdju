import React from "react";
import { Button, DialogContainer as Dialog } from "react-md";
import get from "lodash/get";

import { EditorTypes } from "./reducers/editors";
import t, {
  CANCEL_BUTTON_LABEL,
  CREATE_JUSTIFICATION_SUBMIT_BUTTON_LABEL,
} from "./texts";
import { selectIsWindowNarrow } from "./selectors";
import { ESCAPE_KEY_CODE } from "./keyCodes";
import JustificationEditor from "./JustificationEditor";

import "./CreateJustificationDialog.scss";
import { useAppSelector } from "./hooks";
import { EventHandler } from "react";
import { CommitThenPutAction } from "./editors/withEditor";
import { AnyAction } from "@reduxjs/toolkit";
import { combineIds, combineNames } from "./viewModels";
import { ComponentId, ComponentName } from "./types";

type Props = {
  id: ComponentId;
  name: ComponentName;
  editorId: string;
  visible?: boolean;
  commitAction?: AnyAction;
  onCancel?: EventHandler<React.SyntheticEvent>;
  onHide?: (...args: any[]) => any;
};

export default function CreateJustificationDialog(props: Props) {
  const onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.keyCode === ESCAPE_KEY_CODE) {
      // Stop the escape key from closing the dialog, since it is disruptive
      event.stopPropagation();
    }
  };

  const { id, name, editorId, visible, onCancel, onHide, commitAction } = props;

  const editorState =
    useAppSelector((state) =>
      get(state.editors, [EditorTypes.NEW_JUSTIFICATION, editorId])
    ) || {};
  const isSaving = editorState.isSaving;
  const isWindowNarrow = useAppSelector(selectIsWindowNarrow);

  // Putting these buttons in an array to reuse in both places requires giving them a key, which led to the warning
  // "ButtonTooltipedInked: `key` is not a prop. Trying to access it will result in `undefined` being returned."
  // So just handle them separately so that we don't need to give them a key
  const addNewJustificationDialogCancelButton = (
    <Button
      flat
      children={t(CANCEL_BUTTON_LABEL)}
      onClick={onCancel}
      disabled={isSaving}
    />
  );
  const addNewJustificationDialogSubmitButton = (
    <Button
      raised
      primary
      type="submit"
      children={t(CREATE_JUSTIFICATION_SUBMIT_BUTTON_LABEL)}
      onClick={onSubmit}
      disabled={isSaving}
    />
  );
  // react-md bug: even though fullPage is documented as a boolean property, its presence appears to be interpreted as true
  const addNewJustificationDialogTitle = "Add justification";
  const narrowDialogAttributes = {
    fullPage: true,
    "aria-label": addNewJustificationDialogTitle,
  };
  const notNarrowDialogAttributes = {
    title: addNewJustificationDialogTitle,
    actions: [
      addNewJustificationDialogCancelButton,
      addNewJustificationDialogSubmitButton,
    ],
  };
  const widthDependentAttributes = isWindowNarrow
    ? narrowDialogAttributes
    : notNarrowDialogAttributes;
  return (
    <Dialog
      id="newJustificationDialog"
      visible={visible || false}
      onHide={onHide}
      className="md-overlay--wide-dialog"
      {...widthDependentAttributes}
    >
      {isWindowNarrow && (
        <h2
          id="newJustificationDialogTitle"
          className="md-title md-title--dialog"
        >
          {addNewJustificationDialogTitle}
        </h2>
      )}
      <JustificationEditor
        id={combineIds(id, "editor")}
        name={combineNames(name, "editor")}
        editorId={editorId}
        onKeyDown={onKeyDown}
        editorCommitBehavior={
          commitAction
            ? new CommitThenPutAction(commitAction)
            : "CommitThenView"
        }
      />

      {isWindowNarrow && (
        <footer className="md-dialog-footer md-dialog-footer--inline">
          {addNewJustificationDialogCancelButton}
          {addNewJustificationDialogSubmitButton}
        </footer>
      )}
    </Dialog>
  );
}
