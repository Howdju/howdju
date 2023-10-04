import React, { FormEventHandler, useState } from "react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
} from "@react-md/dialog";
import { MaterialSymbol } from "react-material-symbols";

import {
  CreateSourceInput,
  Source,
  SourceOut,
  UpdateSourceInput,
} from "howdju-common";

import ErrorMessages from "@/ErrorMessages";
import { makeErrorPropCreator } from "@/modelErrorMessages";
import SingleLineTextField from "@/SingleLineTextField";
import { combineIds, combineNames, combineSuggestionsKeys } from "@/viewModels";
import {
  EditorFieldsDispatch,
  EntityEditorFieldsProps,
} from "@/editors/withEditor";
import SourceDescriptionAutocomplete from "./SourceDescriptionAutocomplete";

import IconButton from "../button/IconButton";
import SolidButton from "../button/SolidButton";

const descriptionName = "description";
export interface Props
  extends EntityEditorFieldsProps<
    "source",
    CreateSourceInput | UpdateSourceInput
  > {
  /** Will be called with the persorg upon an autocomplete */
  onSourceNameAutocomplete?: (source: SourceOut) => void;
  onSubmit?: FormEventHandler;
  editorDispatch: EditorFieldsDispatch;
}

export default function SourceEditorFields(props: Props) {
  const {
    id,
    source,
    suggestionsKey,
    name,
    disabled,
    onBlur,
    onPropertyChange,
    errors,
    onSubmit,
    onSourceNameAutocomplete,
    wasSubmitAttempted,
    dirtyFields,
    blurredFields,
    // TODO(341) remove unused editorDispatch.
    editorDispatch: _editorDispatch,
    ...rest
  } = props;

  const onNameAutocomplete = (source: SourceOut) => {
    if (onSourceNameAutocomplete) {
      onSourceNameAutocomplete(source);
    }
  };

  const errorProps = makeErrorPropCreator(
    wasSubmitAttempted,
    errors,
    dirtyFields,
    blurredFields
  );

  const [
    isSourceDescriptionHelpDialogVisible,
    setIsSourceDescriptionHelpDialogVisible,
  ] = useState(false);
  function showSourceDescriptionHelpDialog() {
    setIsSourceDescriptionHelpDialogVisible(true);
  }
  function hideSourceDescriptionHelpDialog() {
    setIsSourceDescriptionHelpDialogVisible(false);
  }

  const descriptionInputProps = {
    id: combineIds(id, descriptionName),
    name: combineNames(name, descriptionName),
    label: "Description",
    maxLength: Source.shape.description.maxLength,
    value: source?.description ?? "",
    required: true,
    onSubmit,
    onBlur,
    onPropertyChange,
    disabled,
    helpText: (
      <span>
        MLA-like, omitting the authors{" "}
        <IconButton
          className="show-source-description-help-dialog"
          onClick={showSourceDescriptionHelpDialog}
        >
          <MaterialSymbol icon="help" />
        </IconButton>
      </span>
    ),
    ...errorProps((s) => s.description),
  };

  const descriptionInput =
    suggestionsKey && !disabled ? (
      <SourceDescriptionAutocomplete
        {...rest}
        {...descriptionInputProps}
        rows={1}
        maxRows={2}
        onAutoComplete={onNameAutocomplete}
        suggestionsKey={combineSuggestionsKeys(suggestionsKey, descriptionName)}
      />
    ) : (
      <SingleLineTextField {...rest} {...descriptionInputProps} />
    );
  // TODO(461) add DialogContainer to DOM once.
  return (
    <div>
      <ErrorMessages errors={errors?._errors} />
      {descriptionInput}
      <Dialog
        id="source-description-help-dialog"
        visible={isSourceDescriptionHelpDialogVisible}
        onRequestClose={hideSourceDescriptionHelpDialog}
        aria-labelledby="source-description-help-dialog-title"
        className="source-description-help-dialog"
      >
        <DialogHeader>
          <DialogTitle id="source-description-help-dialog-title">
            About Source Description
          </DialogTitle>
        </DialogHeader>
        <DialogContent>
          <p>
            The preferred style is MLA-like, but omitting the Authors:
            <ul>
              <li>
                The title of the source comes first and should be in quotes
                unless it is the only field.
              </li>
              <li>
                The date format should be ISO 8601 (YYYY-MM-DD) unless the
                source is updated frequently, in which case including the time
                is recommended.
              </li>
            </ul>
          </p>
          <p>
            Examples:
            <ul>
              <li>
                “Russia Accuses Prigozhin of Trying to Mount a Coup: Live
                Updates” The New York Times (2023-06-23)
              </li>
              <li>
                “Comparison of Blood and Brain Mercury Levels in Infant Monkeys
                Exposed to Methylmercury or Vaccines Containing Thimerosal”
                Environmental Health Perspectives vol. 113,8 (2005): 1015.
                doi:10.1289/ehp.7712
              </li>
            </ul>
          </p>
        </DialogContent>
        <DialogFooter>
          <SolidButton onClick={hideSourceDescriptionHelpDialog}>
            Close
          </SolidButton>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
