import React from "react";

import { CreatePasswordResetRequestInput } from "howdju-common";

import { makeErrorPropCreator } from "@/modelErrorMessages";
import { combineIds, combineNames } from "@/viewModels";
import { EntityEditorFieldsProps } from "@/editors/withEditor";
import EmailTextField from "@/EmailTextField";

interface Props
  extends EntityEditorFieldsProps<
    "passwordResetRequest",
    CreatePasswordResetRequestInput
  > {
  autoFocus?: boolean;
}

export default function PasswordResetRequestEditorFields(props: Props) {
  const {
    id,
    passwordResetRequest,
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

  const emailErrorProps = errorProps((r) => r.email);

  const { email } = passwordResetRequest;
  return (
    <EmailTextField
      id={combineIds(id, "email")}
      name={combineNames(name, "email")}
      value={email}
      maxLength={CreatePasswordResetRequestInput.shape.email.maxLength}
      onBlur={onBlur}
      onSubmit={onSubmit}
      onPropertyChange={onPropertyChange}
      disabled={disabled}
      required
      {...emailErrorProps}
    />
  );
}
