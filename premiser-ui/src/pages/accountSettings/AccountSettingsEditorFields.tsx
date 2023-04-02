import React from "react";

import { AccountSettings } from "howdju-common";

import ErrorMessages from "@/ErrorMessages";
import TextField from "@/TextField";
import { combineIds } from "@/viewModels";
import { EntityEditorFieldsProps } from "@/editors/withEditor";
import { makeErrorPropCreator } from "@/modelErrorMessages";

interface Props
  extends EntityEditorFieldsProps<"accountSettings", AccountSettings> {}

const paidContributionsDisclosureName = "paidContributionsDisclosure";

export default function AccountSettingsEditorFields({
  accountSettings,
  id,
  disabled,
  errors,
  dirtyFields,
  blurredFields,
  onPropertyChange,
  wasSubmitAttempted,
}: Props) {
  const errorProps = makeErrorPropCreator(
    wasSubmitAttempted,
    errors,
    dirtyFields,
    blurredFields
  );
  return (
    <>
      <ErrorMessages errors={errors?._errors} />
      <TextField
        id={combineIds(id, paidContributionsDisclosureName)}
        key="quoteText"
        name={paidContributionsDisclosureName}
        label="Paid contributions disclosure"
        rows={2}
        maxRows={8}
        maxLength={AccountSettings.shape.paidContributionsDisclosure.maxLength}
        value={accountSettings?.paidContributionsDisclosure}
        onPropertyChange={onPropertyChange}
        disabled={disabled}
        {...errorProps((as) => as.paidContributionsDisclosure)}
      />
      <em>
        For example: I receive compensation from Company A for my content
        relating to topics X, Y, and Z.
      </em>
    </>
  );
}
