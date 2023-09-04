import React from "react";

import { CreateRegistrationRequestInput } from "howdju-common";

import EmailTextField from "../../EmailTextField";
import { EntityEditorFieldsProps } from "@/editors/withEditor";
import { makeErrorPropCreator } from "@/modelErrorMessages";
import ErrorMessages from "@/ErrorMessages";
import { combineNames } from "@/viewModels";

interface Props
  extends EntityEditorFieldsProps<
    "registrationRequest",
    CreateRegistrationRequestInput
  > {}

export default function RegistrationRequestFields({
  registrationRequest,
  name,
  disabled,
  errors,
  dirtyFields,
  blurredFields,
  onPropertyChange,
  onBlur,
  onSubmit,
  wasSubmitAttempted,
}: Props) {
  const commonFieldsProps = {
    onBlur,
    onPropertyChange,
    onSubmit,
    disabled,
  };
  const errorProps = makeErrorPropCreator(
    wasSubmitAttempted,
    errors,
    dirtyFields,
    blurredFields
  );

  return (
    <>
      <ErrorMessages errors={errors?._errors} />
      <EmailTextField
        {...commonFieldsProps}
        id="email"
        name={combineNames(name, "email")}
        autocomplete="email"
        value={registrationRequest?.email}
        minLength={
          CreateRegistrationRequestInput.shape.email.minLength ?? undefined
        }
        maxLength={
          CreateRegistrationRequestInput.shape.email.maxLength ?? undefined
        }
        required
        {...errorProps((rr) => rr.email)}
      />
    </>
  );
}
