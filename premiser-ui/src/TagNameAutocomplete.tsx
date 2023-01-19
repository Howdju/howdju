import React from "react";

import { schemaSettings, Tag } from "howdju-common";

import { api } from "./actions";
import ApiAutocomplete, { ApiAutocompleteProps } from "./ApiAutocomplete";
import { tagSchema } from "./normalizationSchemas";
import { cancelTagNameSuggestions } from "./apiActions";
import { useAppDispatch } from "./hooks";
import {
  ComponentId,
  ComponentName,
  OnKeyDownCallback,
  OnPropertyChangeCallback,
  SuggestionsKey,
} from "./types";

interface Props
  extends Omit<
    ApiAutocompleteProps,
    | "onAutocomplete"
    | "fetchSuggestions"
    | "cancelSuggestions"
    | "suggestionSchema"
  > {
  id: ComponentId;
  name: ComponentName;
  suggestionsKey: SuggestionsKey;
  onPropertyChange: OnPropertyChangeCallback;
  onKeyDown: OnKeyDownCallback;
  focusInputOnAutocomplete: boolean;
  onAutocomplete?: (tag: Tag) => void;
}

export default function TagNameAutocomplete(props: Props) {
  const {
    id,
    name,
    suggestionsKey,
    onPropertyChange,
    onKeyDown,
    focusInputOnAutocomplete,
    ...rest
  } = props;

  const onAutocomplete = (tag: Tag) => {
    onPropertyChange({ [name]: tag.name });
    if (props.onAutocomplete) {
      props.onAutocomplete(tag);
    }
  };

  const dispatch = useAppDispatch();

  const fetchSuggestions = () => dispatch(api.fetchTagNameSuggestions);

  return (
    <ApiAutocomplete
      maxLength={schemaSettings.tagNameMaxLength}
      singleLine={true}
      label="Tag"
      {...rest}
      id={id}
      fetchSuggestions={fetchSuggestions}
      cancelSuggestions={cancelTagNameSuggestions}
      suggestionsKey={suggestionsKey}
      suggestionSchema={tagSchema}
      name={name}
      dataLabel="name"
      dataValue="id"
      focusInputOnAutocomplete={focusInputOnAutocomplete}
      onAutocomplete={onAutocomplete}
      onKeyDown={onKeyDown}
      onPropertyChange={onPropertyChange}
    />
  );
}
