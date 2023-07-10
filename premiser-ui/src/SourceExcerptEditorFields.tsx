import React from "react";
import { FontIcon, SelectionControlGroup } from "react-md";
import get from "lodash/get";

import {
  SourceExcerptTypes,
  newExhaustedEnumError,
  CreateSourceExcerptInput,
} from "howdju-common";

import WritQuoteEditorFields from "./WritQuoteEditorFields";
import { useAppSelector } from "./hooks";
import { selectIsWindowNarrow } from "./selectors";
import { EntityEditorFieldsProps } from "./editors/withEditor";
import { OnKeyDownCallback } from "./types";

import "./SourceExcerptEditorFields.scss";
import { makeErrorPropCreator } from "./modelErrorMessages";
import { combineNames } from "./viewModels";
import { logger } from "./logger";

interface Props
  extends EntityEditorFieldsProps<"sourceExcerpt", CreateSourceExcerptInput> {
  sourceExcerpt: CreateSourceExcerptInput;
  onKeyDown: OnKeyDownCallback;
}

export default function SourceExcerptEditorFields({
  sourceExcerpt,
  id,
  name,
  errors,
  wasSubmitAttempted,
  dirtyFields,
  blurredFields,
  disabled,
  onPropertyChange,
  onKeyDown,
  onSubmit,
  suggestionsKey,
  editorDispatch,
}: Props) {
  function onChange(value: string, event: Event) {
    const name = event.target?.name;
    if (!name) {
      logger.error("OnPropertyChange event must have a name");
      return;
    }
    onPropertyChange({ [name]: value });
  }

  const isWindowNarrow = useAppSelector(selectIsWindowNarrow);

  const errorProps = makeErrorPropCreator(
    wasSubmitAttempted,
    errors,
    dirtyFields,
    blurredFields
  );

  const sourceExcerptTypeControls = (
    <SelectionControlGroup
      id={id + "-type"}
      name={combineNames(name, "type")}
      type="radio"
      value={sourceExcerpt.type}
      onChange={onChange}
      inline={isWindowNarrow}
      {...errorProps((se) => se.type)}
      controls={[
        {
          value: SourceExcerptTypes.WRIT_QUOTE,
          label: (
            <div className="selection-label" title="Writ quote">
              <FontIcon>book</FontIcon>
              {isWindowNarrow && (
                <span className="selection-label--text">Writ quote</span>
              )}
            </div>
          ),
        },
        {
          value: SourceExcerptTypes.PIC_REGION,
          label: (
            <div className="selection-label" title="Pic">
              <FontIcon>photo</FontIcon>
              {isWindowNarrow && (
                <span className="selection-label--text">Pic</span>
              )}
            </div>
          ),
        },
        {
          value: SourceExcerptTypes.VID_SEGMENT,
          label: (
            <div className="selection-label" title="Vid">
              <FontIcon>videocam</FontIcon>
              {isWindowNarrow && (
                <span className="selection-label--text">Vid</span>
              )}
            </div>
          ),
        },
      ]}
      disabled={disabled}
    />
  );

  let sourceExcerptEntityEditorFields;
  switch (sourceExcerpt.type) {
    case SourceExcerptTypes.WRIT_QUOTE: {
      const entity = sourceExcerpt.writQuote;
      const entityId = id + "--writ-quote";
      const entityName = combineNames(name, "writQuote");
      const entitySuggestionsKey = suggestionsKey + "--writ-quote";
      const entityErrors = get(errors, "fieldErrors.writQuote");
      sourceExcerptEntityEditorFields = (
        <WritQuoteEditorFields
          writQuote={entity}
          id={entityId}
          name={entityName}
          suggestionsKey={entitySuggestionsKey}
          onPropertyChange={onPropertyChange}
          disabled={disabled}
          errors={entityErrors}
          blurredFields={blurredFields?.writQuote}
          dirtyFields={dirtyFields?.writQuote}
          onKeyDown={onKeyDown}
          onSubmit={onSubmit}
          editorDispatch={editorDispatch}
          wasSubmitAttempted={wasSubmitAttempted}
          {...errorProps((se) => se.writQuote)}
        />
      );
      break;
    }
    case SourceExcerptTypes.PIC_REGION: {
      sourceExcerptEntityEditorFields = <span>Coming soon</span>;
      break;
    }
    case SourceExcerptTypes.VID_SEGMENT: {
      sourceExcerptEntityEditorFields = <span>Coming soon</span>;
      break;
    }
    default:
      throw newExhaustedEnumError(sourceExcerpt.type);
  }
  return (
    <div className="source-excerpt-editor-fields">
      <div className="source-excerpt-editor-fields--type-controls">
        {sourceExcerptTypeControls}
      </div>
      <div className="source-excerpt-editor-fields--entity-controls">
        {sourceExcerptEntityEditorFields}
      </div>
    </div>
  );
}
