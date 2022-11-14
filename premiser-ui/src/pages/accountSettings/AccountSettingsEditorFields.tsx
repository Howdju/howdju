import React from "react";
import get from "lodash/get";

import { AccountSettings, schemaSettings } from "howdju-common";

import ErrorMessages from "@/ErrorMessages";
import TextField from "@/TextField";
import { combineIds, combineNames } from "@/viewModels";
import { EntityEditorFieldsProps } from "@/editors/withEditor";

interface Props extends EntityEditorFieldsProps {
  accountSettings: AccountSettings;
}

const paidContributionsDisclosureName = "paidContributionsDisclosure";

export default function AccountSettingsEditorFields({
  accountSettings,
  id,
  name,
  disabled,
  errors,
  onPropertyChange,
}: Props) {
  const modelErrors = get(errors, "_model");
  return (
    <div>
      <ErrorMessages errors={modelErrors} />
      <TextField
        id={combineIds(id, paidContributionsDisclosureName)}
        key="quoteText"
        name={combineNames(name, paidContributionsDisclosureName)}
        label="Paid contributions disclosure"
        rows={2}
        maxRows={8}
        maxLength={schemaSettings.paidContributionsDisclosureTextMaxLength}
        value={accountSettings.paidContributionsDisclosure}
        onPropertyChange={onPropertyChange}
        disabled={disabled}
      />
      <em>
        For example: I receive compensation from Company A for my content
        relating to topics X, Y, and Z.
      </em>
    </div>
  );
}
