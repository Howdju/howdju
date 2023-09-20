import React from "react";

import {
  CreateMediaExcerptCitationInput,
  MediaExcerptCitation,
} from "howdju-common";

import SingleLineTextField from "@/SingleLineTextField";
import { EntityEditorFieldsProps } from "./withEditor";
import { combineIds, combineNames, combineSuggestionsKeys } from "@/viewModels";
import SourceEditorFields from "@/components/sources/SourceEditorFields";
import { makeErrorPropCreator } from "@/modelErrorMessages";

interface Props
  extends EntityEditorFieldsProps<
    "citations",
    CreateMediaExcerptCitationInput[]
  > {}

export function MediaExcerptCitationsEditorFields({
  id,
  name,
  disabled,
  onBlur,
  onPropertyChange,
  citations,
  wasSubmitAttempted,
  errors,
  dirtyFields,
  blurredFields,
  suggestionsKey,
  editorDispatch,
}: Props) {
  const errorProps = makeErrorPropCreator(
    wasSubmitAttempted,
    errors,
    dirtyFields,
    blurredFields
  );
  return (
    <div>
      {citations?.map(({ source, pincite }, index) => (
        <React.Fragment key={combineIds(id, `citations[${index}]`)}>
          <SourceEditorFields
            id={id}
            source={source}
            key={combineIds(id, `[${index}].source`)}
            errors={errors?.[index]?.source}
            blurredFields={blurredFields?.[index]?.source}
            dirtyFields={dirtyFields?.[index]?.source}
            suggestionsKey={combineSuggestionsKeys(
              suggestionsKey,
              `[${index}].source`
            )}
            name={combineNames(name, `[${index}].source`)}
            editorDispatch={editorDispatch}
            disabled={disabled}
            onBlur={onBlur}
            onPropertyChange={onPropertyChange}
            wasSubmitAttempted={wasSubmitAttempted}
          />
          <SingleLineTextField
            {...errorProps((me) => me[index].pincite)}
            id={combineIds(id, `[${index}].pincite`)}
            name={combineNames(name, `[${index}].pincite`)}
            key={combineIds(id, `[${index}].pincite`)}
            label="Pincite"
            rows={1}
            maxRows={2}
            maxLength={MediaExcerptCitation.shape.pincite.unwrap().maxLength}
            value={pincite}
            onBlur={onBlur}
            onPropertyChange={onPropertyChange}
            disabled={disabled}
          />
        </React.Fragment>
      ))}
    </div>
  );
}
