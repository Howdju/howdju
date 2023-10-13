import React, {
  ChangeEvent,
  ComponentProps,
  FocusEvent,
  KeyboardEvent,
  ReactNode,
  useRef,
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

import "./ApiAutoComplete.scss";
import { keys } from "./keyCodes";
import { FormMessage, FormMessageProps } from "./components/form/FormMessage";
import { combineIds } from "./viewModels";

export type FetchSuggestionsActionCreator = (
  value: string,
  suggestionsKey: SuggestionsKey
) => PayloadAction<any>;
export type CancelSuggestionsActionCreator = (
  suggestionsKey: SuggestionsKey
) => PayloadAction<any>;

export interface Props<T>
  extends Omit<
    ComponentProps<typeof AutoComplete>,
    "data" | "onBlur" | "onAutoComplete" | "maxLength" | "messageProps"
  > {
  id: ComponentId;
  name: string;
  /** The number of milliseconds after typing to wait before fetching suggestions. */
  autocompleteDebounceMs?: number;
  fetchSuggestions: FetchSuggestionsActionCreator;
  cancelSuggestions: CancelSuggestionsActionCreator;
  /** Whether the input should be constrained to a single line. */
  singleLine?: boolean;
  onPropertyChange?: OnPropertyChangeCallback;
  suggestionsKey: SuggestionsKey;
  /** The schema which the component uses to denormalize suggestions */
  suggestionSchema: Schema<T>;
  /** The property on the suggestions to use to display them. */
  labelKey: string;
  onBlur?: OnBlurCallback;
  /** Controls to display to the right of the input. */
  rightControls?: ReactNode;
  onAutoComplete?: (suggestion: T) => void;
  /**
   * The number of rows to display by default. The textarea will automatically
   * update and animate its height when the users types if the `resize` prop is
   * set to `"auto"`.
   */
  rows?: number;
  /**
   * The maximum number of rows that are allowed. When this is set to `-1`, it
   * will infinitely expand based on the text content.
   */
  maxRows?: number;
  maxLength?: number | null;
  messageProps?: FormMessageProps;
}

export default function ApiAutoComplete<T>({
  id,
  name,
  autocompleteDebounceMs = 250,
  fetchSuggestions,
  cancelSuggestions,
  singleLine = true,
  onPropertyChange,
  onBlur,
  suggestionsKey,
  suggestionSchema,
  labelKey,
  rightControls,
  onAutoComplete,
  rows = 1,
  maxRows = -1,
  maxLength,
  onKeyDown,
  value,
  messageProps,
  ...rest
}: Props<T>) {
  const dispatch = useAppDispatch();
  const debouncedFetchSuggestions = useDebouncedCallback((value: string) => {
    dispatch(fetchSuggestions(value, suggestionsKey));
  }, autocompleteDebounceMs);

  function onChange(event: ChangeEvent<HTMLTextAreaElement>) {
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
  function _onBlur(event: FocusEvent<HTMLTextAreaElement>) {
    if (onBlur) {
      onBlur(event);
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

  function _onAutoComplete({ value, dataIndex }: AutoCompleteResult) {
    _onPropertyChange({ [name]: value });
    if (onAutoComplete) {
      const suggestion = suggestions[dataIndex];
      onAutoComplete(suggestion);
    }
  }

  const submitInputRef = useRef<HTMLInputElement | null>(null);
  function _onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (onKeyDown) {
      onKeyDown(event);
    }
    if (!event.isDefaultPrevented() && singleLine && event.key === keys.ENTER) {
      // Since the ApiAutoComplete input is a textarea which lacks the 'enter submits form'
      // behavior, simulate it with a submit input.
      submitInputRef.current?.click();
    }
  }

  return (
    <>
      <div style={{ display: "flex", alignItems: "center" }}>
        <AutoComplete
          {...rest}
          id={id}
          name={name}
          value={value}
          className="api-autocomplete"
          listboxClassName="api-autocomplete-listbox"
          data={suggestionsData}
          labelKey={labelKey}
          valueKey={labelKey}
          onBlur={_onBlur}
          onChange={onChange}
          onKeyDown={_onKeyDown}
          onAutoComplete={_onAutoComplete}
          error={!!messageProps?.errorMessage}
          style={{ flexGrow: 1 }}
          theme="underline"
          filter="none"
          rows={rows}
          maxRows={maxRows}
          maxLength={maxLength ?? undefined}
        />
        {rightControls}
        <input
          ref={(input) => {
            submitInputRef.current = input;
          }}
          type="submit"
          style={{ display: "none" }}
        />
      </div>
      {messageProps && (
        <FormMessage id={combineIds(id, "message")} {...messageProps} />
      )}
    </>
  );
}
