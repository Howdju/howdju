import React, { FormEventHandler, useState } from "react";
import { Switch } from "react-md";

import {
  CreatePersorgInput,
  PersorgOut,
  schemaSettings,
  UpdatePersorgInput,
} from "howdju-common";

import PersorgNameAutocomplete from "./PersorgNameAutocomplete";
import ErrorMessages from "./ErrorMessages";
import { makeErrorPropCreator } from "./modelErrorMessages";
import SingleLineTextArea from "@/components/text/SingleLineTextArea";
import { combineIds, combineNames, combineSuggestionsKeys } from "./viewModels";
import UrlTextField from "./components/text/UrlTextField";
import { toCheckboxOnChangeCallback } from "./util";
import { ComponentId } from "./types";
import {
  EditorFieldsDispatch,
  EntityEditorFieldsProps,
} from "./editors/withEditor";
import TextButton from "./components/button/TextButton";

const nameName = "name";
export interface Props
  extends EntityEditorFieldsProps<
    "persorg",
    CreatePersorgInput | UpdatePersorgInput
  > {
  /** An optional override of the ID of the input for editing the Persorg name.  If absent, an ID will be auto generated based upon {@see id} */
  nameId?: ComponentId;
  /** If present, overrides the default label for the proposition text input */
  nameLabel?: string;
  /** Will be called with the persorg upon an autocomplete */
  onPersorgNameAutocomplete?: (persorg: PersorgOut) => void;
  onSubmit?: FormEventHandler;
  editorDispatch: EditorFieldsDispatch;
}

export default function PersorgEditorFields(props: Props) {
  const {
    id,
    nameId,
    persorg,
    suggestionsKey,
    name,
    nameLabel = "Name",
    disabled,
    onPropertyChange,
    errors,
    onSubmit,
    onPersorgNameAutocomplete,
    wasSubmitAttempted,
    dirtyFields,
    blurredFields,
    // TODO(341) remove unused editorDispatch.
    editorDispatch: _editorDispatch,
    ...rest
  } = props;

  const [showUrls, setShowUrls] = useState(false);

  const onChange = toCheckboxOnChangeCallback(onPropertyChange);

  const onNameAutocomplete = (persorg: PersorgOut) => {
    if (onPersorgNameAutocomplete) {
      onPersorgNameAutocomplete(persorg);
    }
  };

  const onShowUrlsClick = () => {
    setShowUrls(!showUrls);
  };

  const errorProps = makeErrorPropCreator(
    wasSubmitAttempted,
    errors,
    dirtyFields,
    blurredFields
  );

  const nameInputProps = {
    id: nameId || combineIds(id, nameName),
    name: combineNames(name, nameName),
    label: nameLabel,
    maxLength: schemaSettings.persorgNameMaxLength,
    value: persorg?.name ?? "",
    required: true,
    onSubmit,
    onPropertyChange,
    disabled: disabled,
    messageProps: errorProps((p) => p.name),
  };

  const nameInput =
    suggestionsKey && !disabled ? (
      <PersorgNameAutocomplete
        {...rest}
        {...nameInputProps}
        onAutoComplete={onNameAutocomplete}
        suggestionsKey={combineSuggestionsKeys(suggestionsKey, nameName)}
      />
    ) : (
      <SingleLineTextArea {...rest} {...nameInputProps} />
    );
  return (
    <div>
      <ErrorMessages errors={errors?._errors} />
      {nameInput}
      <Switch
        id={combineIds(id, "is-organization")}
        name={combineNames(name, "isOrganization")}
        checked={persorg?.isOrganization ?? false}
        label="Is Organization?"
        disabled={disabled}
        onChange={onChange}
      />
      {persorg && !persorg.isOrganization && (
        <SingleLineTextArea
          id={combineIds(id, "known-for")}
          name={combineNames(name, "knownFor")}
          label="Known for"
          value={persorg?.knownFor ?? ""}
          disabled={disabled}
          onPropertyChange={onPropertyChange}
          onSubmit={onSubmit}
          messageProps={{
            helpMessage:
              "What is this person or organization known for?  (Helps disambiguate people with the same name or for obscure organizations with a better known purpose.)",
            ...errorProps((p) => p.knownFor),
          }}
        />
      )}
      <TextButton onClick={onShowUrlsClick}>
        {showUrls ? "Hide URLs" : "Show URLs"}
      </TextButton>
      {showUrls && [
        <UrlTextField
          key="website"
          id={combineIds(id, "website-url")}
          name={combineNames(name, "websiteUrl")}
          label="Website"
          value={persorg?.websiteUrl ?? ""}
          disabled={disabled}
          onPropertyChange={onPropertyChange}
          onSubmit={onSubmit}
          messageProps={errorProps((p) => p.websiteUrl)}
        />,
        <UrlTextField
          key="wikipedia"
          id={combineIds(id, "wikipedia-url")}
          name={combineNames(name, "wikipediaUrl")}
          label="Wikipedia"
          value={persorg?.wikipediaUrl ?? ""}
          disabled={disabled}
          onPropertyChange={onPropertyChange}
          onSubmit={onSubmit}
          messageProps={errorProps((p) => p.wikipediaUrl)}
        />,
        <UrlTextField
          key="twitter"
          id={combineIds(id, "twitter-url")}
          name={combineNames(name, "twitterUrl")}
          label="Twitter"
          value={persorg?.twitterUrl ?? ""}
          disabled={disabled}
          onPropertyChange={onPropertyChange}
          onSubmit={onSubmit}
          messageProps={errorProps((p) => p.twitterUrl)}
        />,
      ]}
    </div>
  );
}
