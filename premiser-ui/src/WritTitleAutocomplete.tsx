import React from "react";

import { writSchema } from "./normalizationSchemas";
import {
  ComponentId,
  ComponentName,
  OnKeyDownCallback,
  OnPropertyChangeCallback,
  SuggestionsKey,
} from "./types";
import { api } from "./actions";
import { cancelWritTitleSuggestions } from "./apiActions";
import ApiAutocompleteV2 from "./ApiAutoCompleteV2";

interface Props {
  id: ComponentId;
  name: ComponentName;
  value: string;
  suggestionsKey: SuggestionsKey;
  onKeyDown?: OnKeyDownCallback;
  onPropertyChange: OnPropertyChangeCallback;
}

const WritTitleAutocomplete = ({
  id,
  name,
  value,
  suggestionsKey,
  onKeyDown,
  onPropertyChange,
  ...rest
}: Props) => {
  return (
    <ApiAutocompleteV2
      id={id}
      name={name}
      singleLine={true}
      {...rest}
      value={value}
      fetchSuggestions={api.fetchWritTitleSuggestions}
      cancelSuggestions={cancelWritTitleSuggestions}
      onPropertyChange={onPropertyChange}
      suggestionsKey={suggestionsKey}
      labelKey="title"
      suggestionSchema={writSchema}
      onKeyDown={onKeyDown}
    />
  );
};
export default WritTitleAutocomplete;
