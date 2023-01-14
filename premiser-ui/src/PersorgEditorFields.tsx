import React, { useState } from "react";
import { Button, Switch } from "react-md";

import {
  CreatePersorgInput,
  ModelErrors,
  Persorg,
  schemaSettings,
} from "howdju-common";

import PersorgNameAutocomplete from "./PersorgNameAutocomplete";
import ErrorMessages from "./ErrorMessages";
import { makeErrorPropCreator } from "./modelErrorMessages";
import SingleLineTextField from "./SingleLineTextField";
import { combineIds, combineNames, combineSuggestionsKeys } from "./viewModels";
import UrlTextField from "./UrlTextField";
import {
  isTwitterUrl,
  isWikipediaUrl,
  toOnCheckboxChangeCallback,
} from "./util";
import {
  ComponentId,
  ComponentName,
  OnPropertyChangeCallback,
  OnSubmitCallback,
  SuggestionsKey,
} from "./types";
import { BlurredFields, DirtyFields } from "./reducers/editors";

const nameName = "name";
export interface Props {
  persorg: CreatePersorgInput;
  id: ComponentId;
  /** An optional override of the ID of the input for editing the Persorg name.  If absent, an ID will be auto generated based upon {@see id} */
  nameId?: ComponentId;
  /** If present, this string will be prepended to this editor's controls' names, with an intervening "." */
  name: ComponentName;
  /** If omitted, no autocomplete */
  suggestionsKey?: SuggestionsKey;
  /** Will be called with the persorg upon an autocomplete */
  onPersorgNameAutocomplete: (persorg: Persorg) => void;
  onPropertyChange: OnPropertyChangeCallback;
  errors: ModelErrors<CreatePersorgInput> | undefined;
  disabled?: boolean;
  /** If present, overrides the default label for the proposition text input */
  nameLabel?: string;
  onSubmit: OnSubmitCallback;
  wasSubmitAttempted: boolean;
  dirtyFields: DirtyFields<CreatePersorgInput> | undefined;
  blurredFields: BlurredFields<CreatePersorgInput> | undefined;
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
    ...rest
  } = props;

  const [showUrls, setShowUrls] = useState(false);

  const onChange = toOnCheckboxChangeCallback(onPropertyChange);

  const onNameAutocomplete = (persorg: Persorg) => {
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
    value: persorg.name,
    required: true,
    onSubmit,
    onPropertyChange,
    disabled: disabled,
    ...errorProps((p) => p.name),
  };

  const nameInput =
    suggestionsKey && !disabled ? (
      <PersorgNameAutocomplete
        {...rest}
        {...nameInputProps}
        onAutocomplete={onNameAutocomplete}
        suggestionsKey={combineSuggestionsKeys(suggestionsKey, nameName)}
      />
    ) : (
      <SingleLineTextField {...rest} {...nameInputProps} />
    );
  return (
    <div>
      <ErrorMessages errors={errors?._errors} />
      {nameInput}
      <Switch
        id={combineIds(id, "is-organization")}
        name={combineNames(name, "isOrganization")}
        checked={persorg.isOrganization}
        label="Is Organization?"
        disabled={disabled}
        onChange={onChange}
      />
      {!persorg.isOrganization && (
        <SingleLineTextField
          id={combineIds(id, "known-for")}
          name={combineNames(name, "knownFor")}
          label="Known for"
          value={persorg.knownFor}
          helpText="What is this person or organization known for?  (Helps disambiguate people with the same name or for obscure organizations with a better known purpose.)"
          disabled={disabled}
          onPropertyChange={onPropertyChange}
          onSubmit={onSubmit}
        />
      )}
      <Button flat onClick={onShowUrlsClick}>
        {showUrls ? "Hide URLs" : "Show URLs"}
      </Button>
      {showUrls && [
        <UrlTextField
          key="website"
          id={combineIds(id, "website-url")}
          name={combineNames(name, "websiteUrl")}
          label="Website"
          value={persorg.websiteUrl}
          disabled={disabled}
          onPropertyChange={onPropertyChange}
          onSubmit={onSubmit}
        />,
        <UrlTextField
          key="wikipedia"
          id={combineIds(id, "wikipedia-url")}
          name={combineNames(name, "wikipediaUrl")}
          label="Wikipedia"
          value={persorg.wikipediaUrl}
          validator={isWikipediaUrl}
          invalidErrorText="Must be a wikipedia.org address"
          disabled={disabled}
          onPropertyChange={onPropertyChange}
          onSubmit={onSubmit}
        />,
        <UrlTextField
          key="twitter"
          id={combineIds(id, "twitter-url")}
          name={combineNames(name, "twitterUrl")}
          label="Twitter"
          value={persorg.twitterUrl}
          validator={isTwitterUrl}
          invalidErrorText="Must be a twitter.com address"
          disabled={disabled}
          onPropertyChange={onPropertyChange}
          onSubmit={onSubmit}
        />,
      ]}
    </div>
  );
}
