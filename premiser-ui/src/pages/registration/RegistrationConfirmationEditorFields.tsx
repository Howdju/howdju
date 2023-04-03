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
import { toOnCheckboxChangeCallback } from "@/util";
import { toReactMdOnBlur } from "@/types";

interface Props
  extends EntityEditorFieldsProps<
    "registrationConfirmation",
    CreateRegistrationConfirmationInput
  > {
  email: string | null;
}

export default function RegistrationConfirmationEditotFields({
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
  const onCheckboxChange = toOnCheckboxChangeCallback(onPropertyChange);
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
        minLength={CreateRegistrationConfirmationInput.shape.username.minLength}
        maxLength={CreateRegistrationConfirmationInput.shape.username.maxLength}
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
        minLength={CreateRegistrationConfirmationInput.shape.password.minLength}
        maxLength={CreateRegistrationConfirmationInput.shape.password.maxLength}
        required
        {...errorProps((rc) => rc.password)}
      />
      <SingleLineTextField
        {...commonFieldsProps}
        id="long-name"
        name="longName"
        autocomplete="name"
        label="Full Name"
        value={registrationConfirmation?.longName}
        onPropertyChange={onPropertyChange}
        maxLength={CreateRegistrationConfirmationInput.shape.longName.maxLength}
        required
        {...errorProps((rc) => rc.longName)}
      />
      <SingleLineTextField
        {...commonFieldsProps}
        id="short-name"
        name="shortName"
        autocomplete="given-name"
        label="First Name"
        value={registrationConfirmation?.shortName}
        onPropertyChange={onPropertyChange}
        maxLength={
          CreateRegistrationConfirmationInput.shape.shortName.unwrap().maxLength
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
            General Data Protection Regulation (GDPR).
          </div>
        }
        {...errorProps((rc) => rc.isNotGdpr)}
      />
    </>
  );
}
