import React, {
  ChangeEvent,
  ComponentProps,
  FocusEvent,
  ReactNode,
} from "react";
import { PayloadAction } from "@reduxjs/toolkit";
import { AutoComplete, AutoCompleteResult } from "@react-md/autocomplete";
import { useDebouncedCallback } from "use-debounce";
import { denormalize, Schema } from "normalizr";

import { toSingleLine } from "howdju-common";

import {
  ComponentId,
  OnBlurCallback,
  OnPropertyChangeCallback,
  PropertyChanges,
  SuggestionsKey,
} from "./types";
import { useAppDispatch, useAppSelector } from "./hooks";
import { autocompletes } from "./actions";
import { FormMessage } from "@react-md/form";

export type FetchSuggestionsActionCreator = (
  value: string,
  suggestionsKey: SuggestionsKey
) => PayloadAction<any>;
export type CancelSuggestionsActionCreator = (
  suggestionsKey: SuggestionsKey
) => PayloadAction<any>;

interface Props
  extends Omit<ComponentProps<typeof AutoComplete>, "data" | "onBlur"> {
  id: ComponentId;
  name: string;
  autocompleteThrottleMs?: number;
  fetchSuggestions: FetchSuggestionsActionCreator;
  cancelSuggestions: CancelSuggestionsActionCreator;
  /** Whether the input should be constrained to a single line. */
  singleLine?: boolean;
  onPropertyChange?: OnPropertyChangeCallback;
  suggestionsKey: SuggestionsKey;
  /** The schema which the component uses to denormalize suggestions */
  suggestionSchema: Schema;
  /** The property on the suggestions to use to display them. */
  labelKey: string;
  onBlur?: OnBlurCallback;
  /** Error text to display, if any. */
  errorText?: string;
  /** Controls to display to the right of the input. */
  rightControls?: ReactNode;
}

export default function ApiAutocompleteV2({
  id,
  name,
  autocompleteThrottleMs = 250,
  fetchSuggestions,
  cancelSuggestions,
  singleLine = true,
  onPropertyChange,
  onBlur,
  suggestionsKey,
  suggestionSchema,
  labelKey,
  error,
  errorText,
  rightControls,
  ...rest
}: Props) {
  const dispatch = useAppDispatch();
  const debouncedFetchSuggestions = useDebouncedCallback((value: string) => {
    dispatch(fetchSuggestions(value, suggestionsKey));
  }, autocompleteThrottleMs);

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    const name = event.target.name;
    const value = singleLine
      ? toSingleLine(event.target.value)
      : event.target.value;
    _onPropertyChange({ [name]: value });
  }

  function _onPropertyChange(properties: PropertyChanges) {
    if (onPropertyChange) {
      onPropertyChange(properties);
    }
    const val = properties[name];
    if (val) {
      debouncedFetchSuggestions(val);
    } else {
      debouncedFetchSuggestions.cancel();
      dispatch(cancelSuggestions(suggestionsKey));
      clearSuggestions();
    }
  }
  function clearSuggestions() {
    dispatch(autocompletes.clearSuggestions(suggestionsKey));
  }
  function onAutoComplete({ value }: AutoCompleteResult) {
    _onPropertyChange({ [name]: value });
  }
  function _onBlur(event: FocusEvent<HTMLInputElement>) {
    if (onBlur) {
      onBlur(event.target.name);
    }
  }

  const suggestions =
    useAppSelector((state) =>
      denormalize(
        state.autocompletes.suggestions[suggestionsKey],
        [suggestionSchema],
        state.entities
      )
    ) || [];
  const suggestionsData = suggestions.map((s: any) => s[labelKey]);

  return (
    <>
      <div style={{ display: "flex", alignItems: "center" }}>
        <AutoComplete
          {...rest}
          id={id}
          name={name}
          data={suggestionsData}
          labelKey={labelKey}
          valueKey={labelKey}
          onBlur={_onBlur}
          onChange={onChange}
          onAutoComplete={onAutoComplete}
          error={error}
          disableShowOnFocus
          style={{ flexGrow: 1 }}
          theme="underline"
        />
        {rightControls}
      </div>
      {error && errorText && (
        <FormMessage id={`${id}-error`} error>
          {errorText}
        </FormMessage>
      )}
    </>
  );
}
