import React from "react";
import { useDispatch } from "react-redux";

import { Writ } from "howdju-common";

import ApiAutocomplete from "./ApiAutocomplete";
import { writSchema } from "./normalizationSchemas";
import {
  ComponentName,
  OnKeyDownCallback,
  OnPropertyChangeCallback,
  SuggestionsKey,
} from "./types";
import { api } from "./actions";
import { cancelWritTitleSuggestions } from "./apiActions";

interface Props {
  name: ComponentName;
  value: string;
  suggestionsKey: SuggestionsKey;
  onKeyDown?: OnKeyDownCallback;
  onPropertyChange: OnPropertyChangeCallback;
}

const WritTitleAutocomplete = (props: Props) => {
  const { name, value, suggestionsKey, onKeyDown, onPropertyChange, ...rest } =
    props;
  const onAutocomplete = (writ: Writ) => {
    onPropertyChange({ [name]: writ.title });
  };

  const dispatch = useDispatch();

  return (
    <ApiAutocomplete
      name={name}
      singleLine={true}
      {...rest}
      value={value}
      onAutocomplete={onAutocomplete}
      fetchSuggestions={(text: string, suggestionsKey: SuggestionsKey) =>
        dispatch(api.fetchWritTitleSuggestions(text, suggestionsKey))
      }
      cancelSuggestions={(suggestionsKey: SuggestionsKey) =>
        dispatch(cancelWritTitleSuggestions(suggestionsKey))
      }
      onPropertyChange={onPropertyChange}
      suggestionsKey={suggestionsKey}
      dataLabel="title"
      dataValue="id"
      suggestionSchema={writSchema}
      onKeyDown={onKeyDown}
    />
  );
};
export default WritTitleAutocomplete;
