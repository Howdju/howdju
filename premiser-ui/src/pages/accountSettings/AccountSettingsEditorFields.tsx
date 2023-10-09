import React from "react";

import { AccountSettings } from "howdju-common";

import ErrorMessages from "@/ErrorMessages";
import { combineIds } from "@/viewModels";
import { EntityEditorFieldsProps } from "@/editors/withEditor";
import { makeErrorPropCreator } from "@/modelErrorMessages";
import { TextArea } from "@/components/text/TextArea";

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
      <TextArea
        id={combineIds(id, paidContributionsDisclosureName)}
        name={paidContributionsDisclosureName}
        label="Paid contributions disclosure"
        rows={2}
        maxRows={8}
        maxLength={
          AccountSettings.shape.paidContributionsDisclosure.maxLength ||
          undefined
        }
        value={accountSettings?.paidContributionsDisclosure}
        onPropertyChange={onPropertyChange}
        disabled={disabled}
        messageProps={errorProps((as) => as.paidContributionsDisclosure)}
      />
      <em>
        For example: I receive compensation from Company A for my content
        relating to topics X, Y, and Z.
      </em>
    </>
  );
}
