import React from "react";
import get from "lodash/get";

import { ContentReportTypes, schemaSettings } from "howdju-common";

import CheckboxList from "../CheckboxList";
import ErrorMessages from "../ErrorMessages";
import TextField from "../TextField";
import { ArrayIndex, combineIds, combineNames } from "../viewModels";

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

type BooleanObject = {
  [key: string]: boolean | BooleanObject;
};

type ContentReportEditorFieldsProps = {
  contentReport?: object;
  id: string;
  name: string | ArrayIndex;
  disabled?: boolean;
  errors?: object;
  dirtyFields: BooleanObject;
  wasSubmitAttempted: boolean;
  onPropertyChange: (...args: any[]) => any;
};

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
    wasSubmitAttempted,
  } = props;
  const description = get(contentReport, "description");
  const types = get(contentReport, "types");
  const modelErrors = get(errors, "_model");
  const typesErrorText = get(errors, combineNames(name, "types", "message"));
  const isTypesError =
    typesErrorText &&
    (get(dirtyFields, combineNames(name, "types")) || wasSubmitAttempted);
  const descriptionErrorText = get(
    errors,
    combineNames(name, "description", "message")
  );
  const isDescriptionError =
    descriptionErrorText &&
    (get(dirtyFields, combineNames(name, "description")) || wasSubmitAttempted);
  return (
    <>
      <ErrorMessages errors={modelErrors} />
      <CheckboxList
        id={combineIds(id, "types")}
        name={combineNames(name, "types")}
        value={types}
        onPropertyChange={onPropertyChange}
        descriptionsByCode={reportTypeDescriptions}
        disabled={disabled}
        error={isTypesError}
        errorText={typesErrorText}
      />
      <TextField
        id={combineIds(id, "description")}
        key="description"
        name={combineNames(name, "description")}
        label="Description"
        rows={2}
        maxRows={8}
        error={isDescriptionError}
        errorText={descriptionErrorText}
        maxLength={schemaSettings.reportContentDescriptionMaxLength}
        value={description}
        disabled={disabled}
        onPropertyChange={onPropertyChange}
      />
    </>
  );
}
