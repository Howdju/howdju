import React from "react";

import { schemaSettings, Tag } from "howdju-common";

import { api } from "./actions";
import { tagSchema } from "./normalizationSchemas";
import { cancelTagNameSuggestions } from "./apiActions";
import {
  ComponentId,
  ComponentName,
  OnKeyDownCallback,
  OnPropertyChangeCallback,
  SuggestionsKey,
} from "./types";
import ApiAutocompleteV2, {
  Props as ApiAutocompleteProps,
} from "./ApiAutoCompleteV2";

interface Props
  extends Omit<
    ApiAutocompleteProps<Tag>,
    "labelKey" | "fetchSuggestions" | "cancelSuggestions" | "suggestionSchema"
  > {
  id: ComponentId;
  name: ComponentName;
  suggestionsKey: SuggestionsKey;
  onPropertyChange: OnPropertyChangeCallback;
  onKeyDown: OnKeyDownCallback;
  onAutoComplete?: (tag: Tag) => void;
}

export default function TagNameAutocomplete({
  id,
  name,
  suggestionsKey,
  onPropertyChange,
  onKeyDown,
  onAutoComplete,
  ...rest
}: Props) {
  return (
    <ApiAutocompleteV2
      maxLength={schemaSettings.tagNameMaxLength}
      singleLine={true}
      label="Tag"
      {...rest}
      id={id}
      fetchSuggestions={api.fetchTagNameSuggestions}
      cancelSuggestions={cancelTagNameSuggestions}
      suggestionsKey={suggestionsKey}
      suggestionSchema={tagSchema}
      name={name}
      labelKey="name"
      onAutoComplete={onAutoComplete}
      onKeyDown={onKeyDown}
      onPropertyChange={onPropertyChange}
    />
  );
}
