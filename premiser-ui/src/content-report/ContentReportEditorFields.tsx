import React from "react";

import {
  ContentReportTypes,
  CreateContentReportInput,
  schemaSettings,
} from "howdju-common";

import CheckboxList from "../CheckboxList";
import ErrorMessages from "../ErrorMessages";
import TextField from "../TextField";
import { combineIds, combineNames } from "../viewModels";
import { EntityEditorFieldsProps } from "@/editors/withEditor";
import { makeErrorPropCreator } from "@/modelErrorMessages";

const reportTypeDescriptions = {
  [ContentReportTypes.HARASSMENT]: "Harassment",
  [ContentReportTypes.THREATENING_VIOLENCE]: "Threatening violence",
  [ContentReportTypes.HATEFUL]: "Hateful content",
  [ContentReportTypes.OBSCENE]:
    "Obscene content (excessively sexual, violent, or gory)",
  [ContentReportTypes.SEXUALIZATION_OF_MINORS]: "Sexualization of minors",
  [ContentReportTypes.SHARING_PRIVATE_PERSONAL_INFORMATION]:
    "Sharing private personal information",
  [ContentReportTypes.PORNOGRAPHY]: "Pornography",
  [ContentReportTypes.ILLEGAL_ACTIVITY]: "Illegal activity",
  [ContentReportTypes.IMPERSONATION]: "Impersonation",
  [ContentReportTypes.COPYRIGHT_VIOLATION]: "Copyright violation",
  [ContentReportTypes.TRADEMARK_VIOLATION]: "Trademark violation",
  [ContentReportTypes.SPAM]: "Spam",
  [ContentReportTypes.OTHER]: "Other",
};

interface ContentReportEditorFieldsProps
  extends EntityEditorFieldsProps<CreateContentReportInput> {
  contentReport?: CreateContentReportInput;
}

export default function ContentReportEditorFields(
  props: ContentReportEditorFieldsProps
) {
  const {
    contentReport,
    id,
    name,
    disabled,
    errors,
    onPropertyChange,
    dirtyFields,
    blurredFields,
    wasSubmitAttempted,
  } = props;
  const description = contentReport?.description;
  const types = contentReport?.types;
  const errorProps = makeErrorPropCreator(
    wasSubmitAttempted,
    errors,
    dirtyFields,
    blurredFields
  );
  return (
    <>
      <ErrorMessages errors={errors?._errors} />
      <CheckboxList
        id={combineIds(id, "types")}
        name={combineNames(name, "types")}
        value={types}
        onPropertyChange={onPropertyChange}
        descriptionsByCode={reportTypeDescriptions}
        disabled={disabled}
        {...errorProps((cr) => cr.types)}
      />
      <TextField
        id={combineIds(id, "description")}
        key="description"
        name={combineNames(name, "description")}
        label="Description"
        rows={2}
        maxRows={8}
        {...errorProps((cr) => cr.description)}
        maxLength={schemaSettings.reportContentDescriptionMaxLength}
        value={description}
        disabled={disabled}
        onPropertyChange={onPropertyChange}
      />
    </>
  );
}
