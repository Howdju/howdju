import React from "react";

import { Proposition, schemaSettings } from "howdju-common";

import { api } from "./actions";
import ApiAutocomplete from "./ApiAutocomplete";
import { propositionSchema } from "./normalizationSchemas";
import { cancelPropositionTextSuggestions } from "./apiActions";
import {
  ComponentName,
  OnEventCallback,
  OnKeyDownCallback,
  OnPropertyChangeCallback,
  SuggestionsKey,
} from "./types";
import { useAppDispatch } from "./hooks";

interface Props {
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

export default function PropositionTextAutocomplete(props: Props) {
  const { suggestionsKey, onPropertyChange, name, onSubmit, ...rest } = props;

  const onAutocomplete = (proposition: Proposition) => {
    onPropertyChange({ [name]: proposition.text });
  };

  const dispatch = useAppDispatch();

  return (
    <ApiAutocomplete
      {...rest}
      name={name}
      maxLength={schemaSettings.propositionTextMaxLength}
      rows={1}
      maxRows={4}
      singleLine={true}
      onAutocomplete={onAutocomplete}
      fetchSuggestions={(propositionText, suggestionsKey) =>
        dispatch(
          api.fetchPropositionTextSuggestions(propositionText, suggestionsKey)
        )
      }
      cancelSuggestions={cancelPropositionTextSuggestions}
      suggestionsKey={suggestionsKey}
      dataLabel="text"
      dataValue="id"
      suggestionSchema={propositionSchema}
      onPropertyChange={onPropertyChange}
      onSubmit={onSubmit}
    />
  );
}
