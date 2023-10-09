import React from "react";

import { PasswordResetConfirmation } from "howdju-common";

import { makeErrorPropCreator } from "@/modelErrorMessages";
import { combineIds, combineNames } from "@/viewModels";
import { EntityEditorFieldsProps } from "@/editors/withEditor";
import PasswordField from "@/components/text/PasswordField";

interface Props
  extends EntityEditorFieldsProps<
    "passwordResetConfirmation",
    PasswordResetConfirmation
  > {
  autoFocus?: boolean;
}

export default function PasswordResetConfirmationEditorFields(props: Props) {
  const {
    id,
    passwordResetConfirmation,
    name,
    disabled,
    onPropertyChange,
    onBlur,
    errors,
    onSubmit,
    wasSubmitAttempted,
    dirtyFields,
    blurredFields,
    // TODO(341) remove unused editorDispatch.
    editorDispatch: _editorDispatch,
  } = props;

  const errorProps = makeErrorPropCreator(
    wasSubmitAttempted,
    errors,
    dirtyFields,
    blurredFields
  );

  const { newPassword } = passwordResetConfirmation;
  return (
    <PasswordField
      id={combineIds(id, "newPassword")}
      name={combineNames(name, "newPassword")}
      label="New password"
      value={newPassword}
      minLength={
        PasswordResetConfirmation.shape.newPassword.minLength ?? undefined
      }
      maxLength={
        PasswordResetConfirmation.shape.newPassword.maxLength ?? undefined
      }
      onPropertyChange={onPropertyChange}
      onBlur={onBlur}
      onSubmit={onSubmit}
      disabled={disabled}
      required
      messageProps={errorProps((r) => r.newPassword)}
    />
  );
}
