import React from "react";
import { Button, FontIcon, TextField } from "react-md";
import map from "lodash/map";
import get from "lodash/get";
import has from "lodash/has";

import {
  BespokeValidationErrors,
  schemaSettings,
  Url,
  WritQuote,
} from "howdju-common";

import WritTitleAutocomplete from "@/WritTitleAutocomplete";
import { toErrorText } from "@/modelErrorMessages";
import ErrorMessages from "@/ErrorMessages";
import SingleLineTextField from "@/SingleLineTextField";
import { combineIds, combineNames, combineSuggestionsKeys } from "@/viewModels";
import {
  ComponentId,
  ComponentName,
  OnAddCallback,
  OnKeyDownCallback,
  OnPropertyChangeCallback,
  OnRemoveCallback,
  OnSubmitCallback,
  SuggestionsKey,
} from "@/types";

import "./WritQuoteEditorFields.scss";

interface Props {
  writQuote: WritQuote;
  /** If present, this string will be prepended to this editor's controls' ids, with an intervening "." */
  id: ComponentId;
  /** If present, this string will be prepended to this editor's controls' names, with an intervening "." */
  name: ComponentName;
  suggestionsKey: SuggestionsKey;
  onPropertyChange: OnPropertyChangeCallback;
  onKeyDown?: OnKeyDownCallback;
  onSubmit: OnSubmitCallback;
  onAddUrl: OnAddCallback;
  onRemoveUrl: OnRemoveCallback<Url>;
  errors: BespokeValidationErrors;
  disabled?: boolean;
}

const writQuoteTextName = "quoteText";
const writTitleName = "writ.title";

const WritQuoteEditorFields = (props: Props) => {
  const {
    writQuote,
    name,
    id,
    suggestionsKey,
    disabled,
    errors,
    onKeyDown,
    onSubmit,
    onPropertyChange,
    onAddUrl,
    onRemoveUrl,
  } = props;

  const onChange = (value: number | string, event: Event) => {
    if (onPropertyChange && event.target && "name" in event.target) {
      const target: HTMLFormElement = event.target;
      const name = target.name;
      onPropertyChange({ [name]: value });
    }
  };

  const urls = get(writQuote, "urls", []);

  const hasErrors = get(errors, "hasErrors");
  const quoteInputErrorProps =
    hasErrors && errors.fieldErrors.quoteText.length > 0
      ? { error: true, errorText: toErrorText(errors.fieldErrors.quoteText) }
      : {};
  const writTitleInputErrorProps =
    hasErrors && errors.fieldErrors.writ.fieldErrors.title.length > 0
      ? {
          error: true,
          errorText: toErrorText(errors.fieldErrors.writ.fieldErrors.title),
        }
      : {};
  const urlInputErrorProps = hasErrors
    ? map(errors.fieldErrors.urls.itemErrors, (urlError) =>
        urlError.fieldErrors.url.length > 0
          ? { error: true, errorText: toErrorText(urlError.fieldErrors.url) }
          : {}
      )
    : map(urls, () => null);

  const quoteText = get(writQuote, writQuoteTextName) || "";
  const writTitle = get(writQuote, writTitleName) || "";
  const hasWritTitle = has(writQuote, writTitleName);

  const writTitleInputProps = {
    id: combineIds(id, writTitleName),
    name: combineNames(name, writTitleName),
    label: "Title",
    value: writTitle,
    maxLength: schemaSettings.writTitleMaxLength,
    required: true,
    disabled: disabled || !hasWritTitle,
    onKeyDown,
    onSubmit,
    onPropertyChange,
  };

  const combinedSuggestionKeys = combineSuggestionsKeys(
    suggestionsKey,
    writTitleName
  );

  return (
    <div className="writ-quote-editor-fields">
      <TextField
        {...quoteInputErrorProps}
        id={combineIds(id, writQuoteTextName)}
        key="quoteText"
        name={combineNames(name, writQuoteTextName)}
        type="text"
        label="Quote"
        rows={2}
        maxRows={8}
        maxLength={schemaSettings.writQuoteQuoteTextMaxLength}
        value={quoteText}
        onChange={onChange}
        disabled={disabled || !has(writQuote, writQuoteTextName)}
        onKeyDown={onKeyDown}
      />
      {suggestionsKey && !disabled && hasWritTitle ? (
        <WritTitleAutocomplete
          {...writTitleInputProps}
          {...writTitleInputErrorProps}
          suggestionsKey={combinedSuggestionKeys}
        />
      ) : (
        <SingleLineTextField
          {...writTitleInputProps}
          {...writTitleInputErrorProps}
        />
      )}
      {map(urls, (url, index) => (
        <SingleLineTextField
          {...urlInputErrorProps[index]}
          id={combineIds(id, `urls[${index}]`, "url")}
          key={combineIds(id, `urls[${index}]`, "url")}
          name={combineNames(name, `urls[${index}]`, "url")}
          className="urlInput"
          type="url"
          label="URL"
          value={url.url}
          rightIcon={
            <Button
              icon
              onClick={() => onRemoveUrl(url, index)}
              disabled={disabled}
            >
              delete
            </Button>
          }
          rightIconStateful={false}
          disabled={!!url.id || disabled || !!url.target}
          onPropertyChange={onPropertyChange}
          onSubmit={onSubmit}
        />
      ))}
      <Button
        flat
        className="add-button"
        children="Add URL"
        iconEl={<FontIcon>add</FontIcon>}
        onClick={() => onAddUrl(urls.length)}
        disabled={disabled}
      />
      {hasErrors && errors.modelErrors && (
        <ErrorMessages errors={errors.modelErrors} />
      )}
    </div>
  );
};

export default WritQuoteEditorFields;
