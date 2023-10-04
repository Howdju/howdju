import React from "react";
import { FontIcon } from "react-md";

import {
  UpdateWritQuoteInput,
  makeUrl,
  schemaSettings,
  CreateWritQuoteInput,
  CreateUrlInput,
} from "howdju-common";

import ErrorMessages from "@/ErrorMessages";
import SingleLineTextField from "@/SingleLineTextField";
import { combineIds, combineNames, combineSuggestionsKeys } from "@/viewModels";
import { OnKeyDownCallback } from "@/types";
import {
  EditorFieldsDispatch,
  EntityEditorFieldsProps,
} from "./editors/withEditor";
import { makeErrorPropCreator } from "./modelErrorMessages";
import { EditorType } from "./reducers/editors";
import { editors } from "./actions";
import WritEditorFields from "./editors/WritEditorFields";
import TextField from "./TextField";

import "./WritQuoteEditorFields.scss";
import IconButton from "./components/button/IconButton";
import TextButton from "./components/button/TextButton";

interface Props
  extends EntityEditorFieldsProps<
    "writQuote",
    CreateWritQuoteInput | UpdateWritQuoteInput
  > {
  onKeyDown?: OnKeyDownCallback;
  editorDispatch: EditorFieldsDispatch;
}

const writQuoteTextName = "quoteText";

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

  const urls = writQuote?.urls ?? [];

  const errorProps = makeErrorPropCreator(
    wasSubmitAttempted,
    errors,
    dirtyFields,
    blurredFields
  );

  const quoteText = writQuote?.quoteText ?? "";

  const onAddUrl = (index: number) =>
    editorDispatch((editorType: EditorType, editorId: string) =>
      editors.addListItem(
        editorType,
        editorId,
        combineNames(name, "urls"),
        index,
        makeUrl
      )
    );
  const onRemoveUrl = (
    _url: CreateUrlInput,
    index: number,
    _urls: CreateUrlInput[]
  ) =>
    editorDispatch((editorType: EditorType, editorId: string) =>
      editors.removeListItem(
        editorType,
        editorId,
        combineNames(name, "urls"),
        index
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
        onBlur={onBlur}
        onPropertyChange={onPropertyChange}
        disabled={disabled}
        onKeyDown={onKeyDown}
      />
      <WritEditorFields
        id={combineIds(id, "writ")}
        writ={writQuote?.writ}
        editorDispatch={editorDispatch}
        name={combineNames(name, "writ")}
        disabled={disabled}
        suggestionsKey={combineSuggestionsKeys(suggestionsKey, "writ")}
        onPropertyChange={onPropertyChange}
        wasSubmitAttempted={wasSubmitAttempted}
        blurredFields={blurredFields?.writ}
        dirtyFields={dirtyFields?.writ}
        errors={errors?.writ}
      />
      {urls.map(
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
                <IconButton
                  onClick={() => onRemoveUrl(url, index, urls)}
                  disabled={disabled}
                >
                  <FontIcon>delete</FontIcon>
                </IconButton>
              }
              rightIconStateful={false}
              disabled={!!url.id || disabled}
              onBlur={onBlur}
              onPropertyChange={onPropertyChange}
              onSubmit={onSubmit}
            />
          )
      )}
      <TextButton
        className="add-button"
        icon={<FontIcon>add</FontIcon>}
        onClick={() => onAddUrl(urls.length)}
        disabled={disabled}
      >
        Add URL
      </TextButton>
      <ErrorMessages errors={errors?._errors} />
    </div>
  );
};

export default WritQuoteEditorFields;
