import React from "react";
import { Checkbox } from "react-md";
import cn from "classnames";

import { CreateRegistrationConfirmationInput } from "howdju-common";

import Link from "../../Link";
import EmailTextField from "../../EmailTextField";
import PasswordTextField from "../../PasswordTextField";
import paths from "../../paths";
import SingleLineTextField from "../../SingleLineTextField";
import { EntityEditorFieldsProps } from "@/editors/withEditor";
import { makeErrorPropCreator } from "@/modelErrorMessages";
import ErrorMessages from "@/ErrorMessages";
import { toCheckboxOnChangeCallback } from "@/util";
import { toReactMdOnBlur } from "@/types";

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
  const onCheckboxChange = toCheckboxOnChangeCallback(onPropertyChange);
  const errorProps = makeErrorPropCreator(
    wasSubmitAttempted,
    errors,
    dirtyFields,
    blurredFields
  );

  return (
    <>
      <ErrorMessages errors={errors?._errors} />
      <EmailTextField id="email" value={email} disabled />
      <SingleLineTextField
        {...commonFieldsProps}
        id="username"
        name="username"
        autocomplete="username"
        label="Username"
        value={registrationConfirmation?.username}
        onPropertyChange={onPropertyChange}
        minLength={
          CreateRegistrationConfirmationInput.shape.username.minLength ||
          undefined
        }
        maxLength={
          CreateRegistrationConfirmationInput.shape.username.maxLength ||
          undefined
        }
        required
        {...errorProps((rc) => rc.username)}
      />
      <PasswordTextField
        {...commonFieldsProps}
        id="password"
        name="password"
        autocomplete="new-password"
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
        {...errorProps((rc) => rc.password)}
      />
      <SingleLineTextField
        {...commonFieldsProps}
        id="long-name"
        name="longName"
        label="Full Name"
        autocomplete="name"
        value={registrationConfirmation?.longName}
        onPropertyChange={onPropertyChange}
        maxLength={
          CreateRegistrationConfirmationInput.shape.longName.maxLength ||
          undefined
        }
        required
        {...errorProps((rc) => rc.longName)}
      />
      <SingleLineTextField
        {...commonFieldsProps}
        id="short-name"
        name="shortName"
        label="First Name"
        autocomplete="given-name"
        value={registrationConfirmation?.shortName}
        onPropertyChange={onPropertyChange}
        maxLength={
          CreateRegistrationConfirmationInput.shape.shortName.unwrap()
            .maxLength || undefined
        }
        {...errorProps((rc) => rc.shortName)}
      />
      <Checkbox
        {...commonFieldsProps}
        onBlur={toReactMdOnBlur(onBlur)}
        id="does-accept-terms"
        name="doesAcceptTerms"
        checked={registrationConfirmation?.doesAcceptTerms}
        value="true"
        onChange={onCheckboxChange}
        label={
          <div
            className={cn({
              "error-message": errorProps((rc) => rc.doesAcceptTerms).error,
            })}
          >
            I have read and agree to the{" "}
            <Link
              newWindow={true}
              className="text-link"
              to={paths.userAgreement()}
            >
              User Agreement
            </Link>{" "}
            and the{" "}
            <Link
              newWindow={true}
              className="text-link"
              to={paths.privacyPolicy()}
            >
              Privacy Policy
            </Link>
            .
          </div>
        }
        {...errorProps((rc) => rc.doesAcceptTerms)}
      />
      <Checkbox
        {...commonFieldsProps}
        onBlur={toReactMdOnBlur(onBlur)}
        id="is-13-years-or-older"
        name="is13YearsOrOlder"
        checked={registrationConfirmation?.is13YearsOrOlder}
        value="true"
        onChange={onCheckboxChange}
        label={
          <div
            className={cn({
              "error-message": errorProps((rc) => rc.is13YearsOrOlder).error,
            })}
          >
            I am 13 years old or older.
          </div>
        }
        {...errorProps((rc) => rc.is13YearsOrOlder)}
      />
      <Checkbox
        {...commonFieldsProps}
        onBlur={toReactMdOnBlur(onBlur)}
        id="has-majority-consent"
        name="hasMajorityConsent"
        checked={registrationConfirmation?.hasMajorityConsent}
        value="true"
        onChange={onCheckboxChange}
        label={
          <div
            className={cn({
              "error-message": errorProps((rc) => rc.hasMajorityConsent).error,
            })}
          >
            I am old enough in my local jurisdiction to enter into legal
            agreements and to consent to the processing of my personal data.
          </div>
        }
        {...errorProps((rc) => rc.hasMajorityConsent)}
      />
      <Checkbox
        {...commonFieldsProps}
        onBlur={toReactMdOnBlur(onBlur)}
        id="is-not-gdpr"
        name="isNotGdpr"
        checked={registrationConfirmation?.isNotGdpr}
        value="true"
        onChange={onCheckboxChange}
        label={
          <div
            className={cn({
              "error-message": errorProps((rc) => rc.isNotGdpr).error,
            })}
          >
            I am not located in the European Union (EU), the European Economic
            Area (EEA), or in any other jurisdiction that is subject to the
            General Data Protection Regulation (GDPR). (See{" "}
            <a
              target="_blank"
              rel="noreferrer"
              className="text-link"
              href="https://github.com/Howdju/howdju/issues/24"
            >
              Github issue #24
            </a>
            .)
          </div>
        }
        {...errorProps((rc) => rc.isNotGdpr)}
      />
    </>
  );
}
