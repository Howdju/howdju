import React from "react";

import { PropositionOut, schemaSettings } from "howdju-common";

import { api } from "./actions";
import { propositionSchema } from "./normalizationSchemas";
import { cancelPropositionTextSuggestions } from "./apiActions";
import {
  ComponentId,
  ComponentName,
  OnEventCallback,
  OnKeyDownCallback,
  OnPropertyChangeCallback,
  SuggestionsKey,
} from "./types";
import ApiAutoComplete, {
  Props as ApiAutoCompleteProps,
} from "@/components/autocomplete/ApiAutoComplete";

interface Props
  extends Omit<
    ApiAutoCompleteProps<PropositionOut>,
    "fetchSuggestions" | "cancelSuggestions" | "labelKey" | "suggestionSchema"
  > {
  id: ComponentId;
  name: ComponentName;
  /** The value to display in the text input */
  value: string;
  /** Where to store the component's suggestions in the react state (under state.autocompletes.suggestions) */
  suggestionsKey: SuggestionsKey;
  /** The callback for when a user modifies the value in the text input.  Arguments: (val, event) */
  onPropertyChange: OnPropertyChangeCallback;
  onKeyDown?: OnKeyDownCallback;
  onSubmit?: OnEventCallback;
}

export default function PropositionTextAutocomplete({
  id,
  name,
  suggestionsKey,
  onPropertyChange,
  onSubmit,
  ...rest
}: Props) {
  return (
    <ApiAutoComplete
      {...rest}
      id={id}
      name={name}
      maxLength={schemaSettings.propositionTextMaxLength}
      singleLine={true}
      onPropertyChange={onPropertyChange}
      fetchSuggestions={api.fetchPropositionTextSuggestions}
      cancelSuggestions={cancelPropositionTextSuggestions}
      suggestionsKey={suggestionsKey}
      labelKey="text"
      suggestionSchema={propositionSchema}
      onSubmit={onSubmit}
    />
  );
}
