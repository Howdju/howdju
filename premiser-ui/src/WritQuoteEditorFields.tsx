import React from "react";
import { Button, FontIcon, TextField } from "react-md";
import map from "lodash/map";

import {
  CreateWritQuoteInput,
  EditWritQuoteInput,
  makeUrl,
  schemaSettings,
  Url,
  Writ,
} from "howdju-common";

import WritTitleAutocomplete from "@/WritTitleAutocomplete";
import ErrorMessages from "@/ErrorMessages";
import SingleLineTextField from "@/SingleLineTextField";
import { combineIds, combineNames, combineSuggestionsKeys } from "@/viewModels";
import { OnKeyDownCallback, toReactMdOnBlur } from "@/types";
import { EntityEditorFieldsProps } from "./editors/withEditor";
import { makeErrorPropCreator } from "./modelErrorMessages";

import "./WritQuoteEditorFields.scss";
import { EditorType } from "./reducers/editors";
import { editors } from "./actions";
import { logger } from "./logger";

interface Props extends EntityEditorFieldsProps<EditWritQuoteInput> {
  writQuote: CreateWritQuoteInput;
  onKeyDown?: OnKeyDownCallback;
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
    editorDispatch,
    dirtyFields,
    blurredFields,
    wasSubmitAttempted,
  } = props;

  const onChange = (value: number | string, event: Event) => {
    if (onPropertyChange) {
      if (!event.target || !("name" in event.target)) {
        logger.warn(
          "Unable to fire onPropertyChange because event lacked target.name"
        );
        return;
      }
      const name = event.target.name;
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

  const onAddUrl = (index: number) =>
    editorDispatch((editorType: EditorType, editorId: string) =>
      editors.addListItem(
        editorType,
        editorId,
        index,
        combineNames(name, "urls"),
        makeUrl
      )
    );
  const onRemoveUrl = (_url: Url, index: number, _urls: Url[]) =>
    editorDispatch((editorType: EditorType, editorId: string) =>
      editors.removeListItem(
        editorType,
        editorId,
        index,
        combineNames(name, "urls")
      )
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
              className="writ-quote-url-input"
              aria-label="url"
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
