import React from "react";
import { Button, FontIcon, TextField } from "react-md";
import map from "lodash/map";

import {
  EditWritQuoteInput,
  schemaSettings,
  Url,
  Writ,
  WritQuote,
} from "howdju-common";

import WritTitleAutocomplete from "@/WritTitleAutocomplete";
import ErrorMessages from "@/ErrorMessages";
import SingleLineTextField from "@/SingleLineTextField";
import { combineIds, combineNames, combineSuggestionsKeys } from "@/viewModels";
import {
  OnAddCallback,
  OnKeyDownCallback,
  OnRemoveCallback,
  toReactMdOnBlur,
} from "@/types";
import { EntityEditorFieldsProps } from "./editors/withEditor";
import { makeErrorPropCreator } from "./modelErrorMessages";

import "./WritQuoteEditorFields.scss";

interface Props extends EntityEditorFieldsProps<EditWritQuoteInput> {
  writQuote: WritQuote;
  onKeyDown?: OnKeyDownCallback;
  onAddUrl: OnAddCallback;
  onRemoveUrl: OnRemoveCallback<Url>;
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
    onBlur,
    onPropertyChange,
    onAddUrl,
    onRemoveUrl,
    dirtyFields,
    blurredFields,
    wasSubmitAttempted,
  } = props;

  const onChange = (value: number | string, event: Event) => {
    if (onPropertyChange && event.target && "name" in event.target) {
      const target: HTMLFormElement = event.target;
      const name = target.name;
      onPropertyChange({ [name]: value });
    }
  };

  const urls = writQuote.urls ?? [];

  const errorProps = makeErrorPropCreator(
    wasSubmitAttempted,
    errors,
    dirtyFields,
    blurredFields
  );

  const writTitleInputErrorProps = errorProps((wq) => wq.writ.title);

  const quoteText = writQuote.quoteText ?? "";
  const writTitle = writQuote.writ.title ?? "";

  const writTitleInputProps = {
    id: combineIds(id, writTitleName),
    name: combineNames(name, writTitleName),
    label: "Title",
    value: writTitle,
    minLength: Writ.shape.title.minLength,
    maxLength: Writ.shape.title.maxLength,
    required: true,
    disabled: disabled,
    onBlur,
    onKeyDown,
    onPropertyChange,
    onSubmit,
  };

  const combinedSuggestionKeys = combineSuggestionsKeys(
    suggestionsKey,
    writTitleName
  );

  return (
    <div className="writ-quote-editor-fields">
      <TextField
        {...errorProps((wq) => wq.quoteText)}
        id={combineIds(id, writQuoteTextName)}
        key="quoteText"
        name={combineNames(name, writQuoteTextName)}
        type="text"
        label="Quote"
        rows={2}
        maxRows={8}
        maxLength={schemaSettings.writQuoteQuoteTextMaxLength}
        value={quoteText}
        onBlur={toReactMdOnBlur(onBlur)}
        onChange={onChange}
        disabled={disabled}
        onKeyDown={onKeyDown}
      />
      {suggestionsKey && !disabled ? (
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
      {map(
        urls,
        (url, index, urls) =>
          url && (
            <SingleLineTextField
              {...errorProps((wq) => wq.urls[index].url)}
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
                  onClick={() => onRemoveUrl(url, index, urls)}
                  disabled={disabled}
                >
                  delete
                </Button>
              }
              rightIconStateful={false}
              disabled={!!url.id || disabled || !!url.target}
              onBlur={onBlur}
              onPropertyChange={onPropertyChange}
              onSubmit={onSubmit}
            />
          )
      )}
      <Button
        flat
        className="add-button"
        children="Add URL"
        iconEl={<FontIcon>add</FontIcon>}
        onClick={() => onAddUrl(urls.length)}
        disabled={disabled}
      />
      <ErrorMessages errors={errors?._errors} />
    </div>
  );
};

export default WritQuoteEditorFields;
