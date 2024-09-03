import React from "react";

import {
  api,
  writSchema,
  cancelWritTitleSuggestions,
  SuggestionsKey,
} from "howdju-client-common";

import {
  ComponentId,
  ComponentName,
  OnKeyDownCallback,
  OnPropertyChangeCallback,
} from "./types";
import ApiAutoComplete from "@/components/autocomplete/ApiAutoComplete";

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
    <ApiAutoComplete
      id={id}
      name={name}
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
