import React, { useState } from "react";
import { EventHandler } from "react";
import { AnyAction } from "@reduxjs/toolkit";
import get from "lodash/get";

import { EditorTypes } from "./reducers/editors";
import t, {
  CANCEL_BUTTON_LABEL,
  CREATE_JUSTIFICATION_SUBMIT_BUTTON_LABEL,
} from "./texts";
import { ESCAPE_KEY_CODE } from "./keyCodes";
import JustificationEditor from "./editors/JustificationEditor";
import { useAppDispatch, useAppSelector } from "./hooks";
import { CommitThenPutAction, submitButtonTitle } from "./editors/withEditor";
import { combineIds } from "./viewModels";
import { ComponentId } from "./types";
import { editors, flows } from "./actions";
import justificationsPage from "./pages/justifications/justificationsPageSlice";
import SubmitButton from "./editors/SubmitButton";
import CancelButton from "./editors/CancelButton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from "./components/dialog/Dialog";

type Props = {
  id: ComponentId;
  editorId: string;
  visible?: boolean;
  commitAction?: AnyAction;
  onCancel?: EventHandler<React.SyntheticEvent>;
  onHide: () => void;
};

export default function CreateJustificationDialog(props: Props) {
  const { id, editorId, visible, onCancel, onHide, commitAction } = props;

  const { isSaving, wasSubmitAttempted } = useAppSelector((state) =>
    get(state.editors, [EditorTypes.NEW_JUSTIFICATION, editorId])
  );

  const dispatch = useAppDispatch();
  const [isValid, setIsValid] = useState(false);

  const onSubmit = (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
    event.preventDefault();
    if (!isValid || isSaving) {
      dispatch(
        editors.attemptedSubmit(EditorTypes.NEW_JUSTIFICATION, editorId)
      );
      return;
    }
    dispatch(
      flows.commitEditThenPutActionOnSuccess(
        EditorTypes.NEW_JUSTIFICATION,
        editorId,
        justificationsPage.hideNewJustificationDialog()
      )
    );
  };
  const onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.keyCode === ESCAPE_KEY_CODE) {
      // Stop the escape key from closing the dialog, since it is disruptive
      event.stopPropagation();
    }
  };

  // Putting these buttons in an array to reuse in both places requires giving them a key, which led to the warning
  // "ButtonTooltipedInked: `key` is not a prop. Trying to access it will result in `undefined` being returned."
  // So just handle them separately so that we don't need to give them a key
  const addNewJustificationDialogCancelButton = (
    <CancelButton
      children={t(CANCEL_BUTTON_LABEL)}
      onClick={onCancel}
      disabled={isSaving}
    />
  );
  const addNewJustificationDialogSubmitButton = (
    <SubmitButton
      children={t(CREATE_JUSTIFICATION_SUBMIT_BUTTON_LABEL)}
      onClick={onSubmit}
      title={submitButtonTitle(isValid, wasSubmitAttempted)}
      appearDisabled={!isValid || isSaving}
    />
  );
  return (
    <Dialog
      id="newJustificationDialog"
      visible={visible || false}
      onRequestClose={onHide}
      title="Add justification"
    >
      <DialogContent>
        <JustificationEditor
          id={combineIds(id, "editor")}
          editorId={editorId}
          onKeyDown={onKeyDown}
          showButtons={false}
          onValidityChange={setIsValid}
          commitBehavior={
            commitAction
              ? new CommitThenPutAction(commitAction)
              : "CommitThenView"
          }
        />
      </DialogContent>
      <DialogFooter>
        {addNewJustificationDialogCancelButton}
        {addNewJustificationDialogSubmitButton}
      </DialogFooter>
    </Dialog>
  );
}
