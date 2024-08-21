import React from "react";
import { MaterialSymbol } from "react-material-symbols";

import { CreateRegistrationConfirmationInput } from "howdju-common";

import EmailField from "@/components/text/EmailTextField";
import PasswordField from "@/components/text/PasswordField";
import paths from "@/paths";
import { EntityEditorFieldsProps } from "@/editors/withEditor";
import { makeErrorPropCreator } from "@/modelErrorMessages";
import ErrorMessages from "@/ErrorMessages";
import { Checkbox } from "@/components/input/Checkbox";
import { TextField } from "@/components/text/TextField";

interface Props
  extends EntityEditorFieldsProps<
    "registrationConfirmation",
    CreateRegistrationConfirmationInput
  > {
  email: string | undefined;
}

export default function RegistrationConfirmationEditorFields({
  registrationConfirmation,
  email,
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
      <EmailField id="email" value={email} disabled />
      <TextField
        {...commonFieldsProps}
        id="username"
        name="username"
        autoComplete="username"
        label="Username"
        value={registrationConfirmation?.username}
        onPropertyChange={onPropertyChange}
        leftChildren={<MaterialSymbol icon="person" />}
        minLength={
          CreateRegistrationConfirmationInput.shape.username.minLength ||
          undefined
        }
        maxLength={
          CreateRegistrationConfirmationInput.shape.username.maxLength ||
          undefined
        }
        required
        messageProps={errorProps((rc) => rc.username)}
      />
      <PasswordField
        {...commonFieldsProps}
        id="password"
        name="password"
        autoComplete="new-password"
        value={registrationConfirmation?.password}
        onPropertyChange={onPropertyChange}
        minLength={
          CreateRegistrationConfirmationInput.shape.password.minLength ??
          undefined
        }
        maxLength={
          CreateRegistrationConfirmationInput.shape.password.maxLength ??
          undefined
        }
        required
        messageProps={errorProps((rc) => rc.password)}
      />
      <TextField
        {...commonFieldsProps}
        id="long-name"
        name="longName"
        label="Full Name"
        autoComplete="name"
        value={registrationConfirmation?.longName}
        onPropertyChange={onPropertyChange}
        maxLength={
          CreateRegistrationConfirmationInput.shape.longName.maxLength ||
          undefined
        }
        required
        messageProps={errorProps((rc) => rc.longName)}
      />
      <TextField
        {...commonFieldsProps}
        id="short-name"
        name="shortName"
        label="First Name"
        autoComplete="given-name"
        value={registrationConfirmation?.shortName}
        onPropertyChange={onPropertyChange}
        maxLength={
          CreateRegistrationConfirmationInput.shape.shortName.unwrap()
            .maxLength || undefined
        }
        messageProps={errorProps((rc) => rc.shortName)}
      />
      <Checkbox
        {...commonFieldsProps}
        onBlur={onBlur}
        id="does-accept-terms"
        name="doesAcceptTerms"
        checked={registrationConfirmation?.doesAcceptTerms}
        onPropertyChange={onPropertyChange}
        label={
          <div>
            I have read and agree to the{" "}
            <a
              href={paths.userAgreement()}
              className="text-link"
            >
              User Agreement
            </a>{" "}
            and the{" "}
            <a
              href={paths.privacyPolicy()}
              className="text-link"
            >
              Privacy Policy
            </a>
            .
          </div>
        }
        messageProps={errorProps((rc) => rc.doesAcceptTerms)}
      />
      <Checkbox
        {...commonFieldsProps}
        onBlur={onBlur}
        id="is-13-years-or-older"
        name="is13YearsOrOlder"
        checked={registrationConfirmation?.is13YearsOrOlder}
        onPropertyChange={onPropertyChange}
        label={<div>I am 13 years old or older.</div>}
        messageProps={errorProps((rc) => rc.is13YearsOrOlder)}
      />
      <Checkbox
        {...commonFieldsProps}
        onBlur={onBlur}
        id="has-majority-consent"
        name="hasMajorityConsent"
        checked={registrationConfirmation?.hasMajorityConsent}
        onPropertyChange={onPropertyChange}
        label={
          <div>
            I am old enough in my local jurisdiction to enter into legal
            agreements and to consent to the processing of my personal data.
          </div>
        }
        messageProps={errorProps((rc) => rc.hasMajorityConsent)}
      />
      <Checkbox
        {...commonFieldsProps}
        onBlur={onBlur}
        id="is-not-gdpr"
        name="isNotGdpr"
        checked={registrationConfirmation?.isNotGdpr}
        onPropertyChange={onPropertyChange}
        label={
          <div>
            I am not located in the European Union (EU), the European Economic
            Area (EEA), or in any other jurisdiction that is subject to the
            General Data Protection Regulation (GDPR). (See{" "}
            <a
              target="_blank"
              rel="noopener noreferrer"
              className="text-link"
              href="https://github.com/Howdju/howdju/issues/24"
            >
              Github issue #24
            </a>
            .)
          </div>
        }
        messageProps={errorProps((rc) => rc.isNotGdpr)}
      />
    </>
  );
}
