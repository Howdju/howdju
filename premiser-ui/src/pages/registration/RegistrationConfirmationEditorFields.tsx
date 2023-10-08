import React from "react";
import { Checkbox } from "react-md";
import cn from "classnames";

import { CreateRegistrationConfirmationInput } from "howdju-common";

import EmailField from "../../components/text/EmailTextField";
import PasswordField from "../../components/text/PasswordField";
import paths from "../../paths";
import SingleLineTextArea from "@/components/text/SingleLineTextArea";
import { EntityEditorFieldsProps } from "@/editors/withEditor";
import {
  makeErrorPropCreator,
  makeReactMd1ErrorPropCreator,
} from "@/modelErrorMessages";
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
  const reactMd1ErrorProps = makeReactMd1ErrorPropCreator(
    wasSubmitAttempted,
    errors,
    dirtyFields,
    blurredFields
  );

  return (
    <>
      <ErrorMessages errors={errors?._errors} />
      <EmailField id="email" value={email} disabled />
      <SingleLineTextArea
        {...commonFieldsProps}
        id="username"
        name="username"
        autoComplete="username"
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
      <SingleLineTextArea
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
      <SingleLineTextArea
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
        onBlur={toReactMdOnBlur(onBlur)}
        id="does-accept-terms"
        name="doesAcceptTerms"
        checked={registrationConfirmation?.doesAcceptTerms}
        value="true"
        onChange={onCheckboxChange}
        label={
          <div
            className={cn({
              "error-message": !!errorProps((rc) => rc.doesAcceptTerms)
                .errorMessage,
            })}
          >
            I have read and agree to the{" "}
            <a
              href={paths.userAgreement()}
              target="_blank"
              rel="noreferrer"
              className="text-link"
            >
              User Agreement
            </a>{" "}
            and the{" "}
            <a
              href={paths.privacyPolicy()}
              target="_blank"
              rel="noreferrer"
              className="text-link"
            >
              Privacy Policy
            </a>
            .
          </div>
        }
        {...reactMd1ErrorProps((rc) => rc.doesAcceptTerms)}
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
              "error-message": !!errorProps((rc) => rc.is13YearsOrOlder)
                .errorMessage,
            })}
          >
            I am 13 years old or older.
          </div>
        }
        {...reactMd1ErrorProps((rc) => rc.is13YearsOrOlder)}
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
          // TODO(17) allow helpText to have an error state (don't forget other .errorMessage in
          // this component.)
          <div
            className={cn({
              "error-message": !!errorProps((rc) => rc.hasMajorityConsent)
                .errorMessage,
            })}
          >
            I am old enough in my local jurisdiction to enter into legal
            agreements and to consent to the processing of my personal data.
          </div>
        }
        {...reactMd1ErrorProps((rc) => rc.hasMajorityConsent)}
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
              "error-message": !!errorProps((rc) => rc.isNotGdpr).errorMessage,
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
        {...reactMd1ErrorProps((rc) => rc.isNotGdpr)}
      />
    </>
  );
}
