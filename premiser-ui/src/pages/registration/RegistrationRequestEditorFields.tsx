import React from "react";

import { CreateRegistrationRequestInput } from "howdju-common";

import EmailField from "../../components/text/EmailTextField";
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
  const errorProps = makeErrorPropCreator(
    wasSubmitAttempted,
    errors,
    dirtyFields,
    blurredFields
  );

  return (
    <>
      <ErrorMessages errors={errors?._errors} />
      <EmailField
        id="email"
        name={combineNames(name, "email")}
        autoComplete="email"
        value={registrationRequest?.email}
        maxLength={CreateRegistrationRequestInput.shape.email.maxLength}
        onBlur={onBlur}
        onPropertyChange={onPropertyChange}
        onSubmit={onSubmit}
        disabled={disabled}
        messageProps={{
          ...errorProps((rr) => rr.email),
        }}
        required
      />
    </>
  );
}
