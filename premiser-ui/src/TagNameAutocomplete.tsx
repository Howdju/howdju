import React from "react";

import { schemaSettings, TagOut } from "howdju-common";
import { api, tagSchema, cancelTagNameSuggestions } from "howdju-client-common";

import { OnKeyDownCallback } from "@/types";
import ApiAutoComplete, {
  Props as ApiAutocompleteProps,
} from "@/components/autocomplete/ApiAutoComplete";

interface Props
  extends Omit<
    ApiAutocompleteProps<TagOut>,
    "labelKey" | "fetchSuggestions" | "cancelSuggestions" | "suggestionSchema"
  > {
  onKeyDown: OnKeyDownCallback;
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
    <ApiAutoComplete
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
