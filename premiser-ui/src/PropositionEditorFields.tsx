import React, { useState } from "react";
import { MaterialSymbol } from "react-material-symbols";

import { CreatePropositionInput, UpdatePropositionInput } from "howdju-common";

import SingleLineTextArea from "@/components/text/SingleLineTextArea";
import PropositionTextAutocomplete from "./PropositionTextAutocomplete";
import { makeErrorPropCreator } from "./modelErrorMessages";
import ErrorMessages from "./ErrorMessages";
import { combineIds, combineNames, combineSuggestionsKeys } from "./viewModels";
import { OnKeyDownCallback } from "./types";
import { EntityEditorFieldsProps } from "./editors/withEditor";
import { Checkbox } from "./components/input/Checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from "@/components/dialog/Dialog";
import IconButton from "@/components/button/IconButton";
import SolidButton from "./components/button/SolidButton";
import Link from "./Link";

const textName = "text";

interface Props
  extends EntityEditorFieldsProps<
    "proposition",
    CreatePropositionInput | UpdatePropositionInput
  > {
  onKeyDown?: OnKeyDownCallback;
  autoFocus?: boolean;
  showQuestionCheckbox?: boolean;
}

export default function PropositionEditorFields(props: Props) {
  const {
    id,
    proposition,
    suggestionsKey,
    name,
    disabled,
    onPropertyChange,
    errors,
    onKeyDown,
    onSubmit,
    wasSubmitAttempted,
    dirtyFields,
    blurredFields,
    autoFocus,
    showQuestionCheckbox = false,
    // TODO(341) remove unused editorDispatch.
    editorDispatch: _editorDispatch,
    ...rest
  } = props;

  const errorProps = makeErrorPropCreator(
    wasSubmitAttempted,
    errors,
    dirtyFields,
    blurredFields
  );

  const textProps = {
    id: combineIds(id, "text"),
    name: combineNames(name, textName),
    label: "Text",
    value: proposition?.text ?? "",
    required: true,
    autoFocus,
    onKeyDown,
    onSubmit,
    onPropertyChange,
    disabled,
    messageProps: errorProps((p) => p.text),
  };

  const textInput =
    suggestionsKey && !disabled ? (
      <PropositionTextAutocomplete
        {...rest}
        {...textProps}
        suggestionsKey={combineSuggestionsKeys(suggestionsKey, textName)}
      />
    ) : (
      <SingleLineTextArea {...rest} {...textProps} />
    );

  const [
    isPropositionQuestionHelpDialogVisible,
    setIsSourceDescriptionHelpDialogVisible,
  ] = useState(false);
  function showSourceDescriptionHelpDialog() {
    setIsSourceDescriptionHelpDialogVisible(true);
  }
  function hidePropositionQuestionHelpDialog() {
    setIsSourceDescriptionHelpDialogVisible(false);
  }
  const createQuestionCheckbox = showQuestionCheckbox && (
    <Checkbox
      id={combineIds(id, "is-question")}
      name={combineNames(name, "isQuestion")}
      onPropertyChange={onPropertyChange}
      disabled={disabled}
      label={
        <p>
          create as a question{" "}
          <IconButton
            className="show-source-description-help-dialog"
            onClick={showSourceDescriptionHelpDialog}
          >
            <MaterialSymbol icon="help" />
          </IconButton>
        </p>
      }
      messageProps={errorProps((s) => s.isQuestion)}
    />
  );
  // TODO(#461) add dialog to the DOM only once
  const isQuestionHelpDialog = (
    <Dialog
      id="proposition-question-help-dialog"
      visible={isPropositionQuestionHelpDialogVisible}
      onRequestClose={hidePropositionQuestionHelpDialog}
      title="Question Propositions"
      className="proposition-question-help-dialog"
    >
      <DialogContent>
        <p>
          Although all propositions should be considered as open to question,
          creating a proposition as a question will include a note next to the
          proposition that it was created as a question. This allows the creator
          to signal to other users that they are not creating the proposition as
          an unqualified statement of fact, but rather creating the proposition
          in a questioning mood.
        </p>
        <p>
          See the{" "}
          <Link to="https://docs.howdju.com/concepts/propositions">
            docs on Questions
          </Link>{" "}
          for more details.
        </p>
      </DialogContent>
      <DialogFooter>
        <SolidButton onClick={hidePropositionQuestionHelpDialog}>
          Close
        </SolidButton>
      </DialogFooter>
    </Dialog>
  );
  return (
    <div>
      <ErrorMessages errors={errors?._errors} />
      {textInput}
      {createQuestionCheckbox}
      {isQuestionHelpDialog}
    </div>
  );
}
