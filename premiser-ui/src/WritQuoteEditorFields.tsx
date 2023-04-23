import React from "react";
import { Button, FontIcon, TextField } from "react-md";
import map from "lodash/map";

import {
  UpdateWritQuoteInput,
  makeUrl,
  schemaSettings,
  Url,
  CreateWritQuoteInput,
} from "howdju-common";

import ErrorMessages from "@/ErrorMessages";
import SingleLineTextField from "@/SingleLineTextField";
import { combineIds, combineNames, combineSuggestionsKeys } from "@/viewModels";
import { OnKeyDownCallback, toReactMdOnBlur } from "@/types";
import {
  EditorFieldsDispatch,
  EntityEditorFieldsProps,
} from "./editors/withEditor";
import { makeErrorPropCreator } from "./modelErrorMessages";
import { EditorType } from "./reducers/editors";
import { editors } from "./actions";
import { logger } from "./logger";

import "./WritQuoteEditorFields.scss";
import WritEditorFields from "./editors/WritEditorFields";

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
      <WritEditorFields
        id={combineIds(id, "writ")}
        writ={writQuote?.writ}
        editorDispatch={editorDispatch}
        name={combineNames(name, "writ")}
        disabled={disabled}
        suggestionsKey={combineSuggestionsKeys(suggestionsKey, "writ")}
        onPropertyChange={onPropertyChange}
        wasSubmitAttempted={wasSubmitAttempted}
      />
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
              onBlur={toReactMdOnBlur(onBlur)}
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
