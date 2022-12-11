import React, { ChangeEvent, FocusEvent, FormEvent, useEffect } from "react";
import { goBack } from "connected-react-router";
import {
  Button,
  Card,
  CardActions,
  CardText,
  CardTitle,
  Checkbox,
  CircularProgress,
  FocusContainer,
} from "react-md";
import cn from "classnames";
import get from "lodash/get";
import isEmpty from "lodash/isEmpty";
import queryString from "query-string";
import { CheckboxProps } from "react-md/lib/SelectionControls/Checkbox";
import { isArray } from "lodash";
import { useLocation } from "react-router";

import {
  apiErrorCodes,
  EntityErrorCodes,
  logger,
  makeCreateRegistrationConfirmationInput,
  schemas,
  schemaSettings,
  onlyFieldError,
  RegistrationConfirmation,
  BespokeValidationErrors,
} from "howdju-common";
import { validate } from "howdju-ajv-sourced";

import Helmet from "../../Helmet";
import { api, editors } from "../../actions";
import Link from "../../Link";
import EmailTextField from "../../EmailTextField";
import PasswordTextField from "../../PasswordTextField";
import paths from "../../paths";
import { EditorState, EditorTypes } from "../../reducers/editors";
import {
  selectDidCheckRegistration,
  selectRegistrationErrorCode,
  selectRegistrationEmail,
} from "../../selectors";
import SingleLineTextField from "../../SingleLineTextField";
import { useAppDispatch, useAppSelector } from "@/hooks";
import { PropertyChanges } from "@/types";

const editorId = "registration-confirmation-page";
const editorType = EditorTypes.REGISTRATION_CONFIRMATION;

export default function RegistrationConfirmationPage() {
  const location = useLocation();
  const registrationCodeParam = get(
    queryString.parse(location.search),
    "registrationCode"
  );

  if (isArray(registrationCodeParam)) {
    logger.error(
      "RegistrationConfirmationPage visited with multiple registration codes. Using first."
    );
  }
  const registrationCode = isArray(registrationCodeParam)
    ? registrationCodeParam[0]
    : registrationCodeParam;

  const dispatch = useAppDispatch();
  useEffect(() => {
    if (!registrationCode) {
      return;
    }
    dispatch(api.checkRegistration(registrationCode));
    dispatch(
      editors.beginEdit(
        editorType,
        editorId,
        makeCreateRegistrationConfirmationInput({ registrationCode })
      )
    );
  }, [dispatch, registrationCode]);

  const editorState = useAppSelector((state) =>
    get(state, ["editors", editorType, editorId])
  ) as EditorState<RegistrationConfirmation>;

  const email = useAppSelector(selectRegistrationEmail);
  const didCheckRegistration = useAppSelector(selectDidCheckRegistration);
  const apiErrorCode = useAppSelector(selectRegistrationErrorCode);

  if (!registrationCode) {
    return makePage(
      undefined,
      <span className="error-message">Missing registration code</span>
    );
  }
  if (!editorState) {
    return makePage(undefined, <CircularProgress id={editorId} />);
  }

  const isSubmitting = editorState?.isSaving;
  const isConfirmed = editorState?.isSaved;
  const remoteErrors = editorState?.errors as unknown as
    | BespokeValidationErrors
    | undefined;
  const blurredFields = editorState?.blurredFields;
  const dirtyFields = editorState?.dirtyFields;

  const registrationConfirmation = editorState?.editEntity;
  const wasSubmitAttempted = editorState?.wasSubmitAttempted;
  const username = registrationConfirmation?.username;
  const shortName = registrationConfirmation?.shortName;
  const longName = registrationConfirmation?.longName;
  const password = registrationConfirmation?.password;
  const doesAcceptTerms = registrationConfirmation?.doesAcceptTerms;
  const hasMajorityConsent = registrationConfirmation?.hasMajorityConsent;
  const is13YearsOrOlder = registrationConfirmation?.is13YearsOrOlder;
  const isNotGdpr = registrationConfirmation?.isNotGdpr;

  const { errors: localErrors } = validate(
    schemas.registrationConfirmation,
    registrationConfirmation
  );
  const isValid = isEmpty(localErrors);

  const validationErrorMessage =
    !wasSubmitAttempted || isValid ? null : "Please correct the errors below";

  const submitButtonTitle = isValid
    ? "Complete registration"
    : wasSubmitAttempted
    ? "Please correct the errors to continue"
    : "Please complete the form to continue";

  let subtitle;
  if (apiErrorCode) {
    if (apiErrorCode in subtitleByRegistrationErrorCode) {
      subtitle =
        apiErrorCode &&
        subtitleByRegistrationErrorCode[
          apiErrorCode as keyof typeof subtitleByRegistrationErrorCode
        ];
    }
  }

  const onPropertyChange = (properties: PropertyChanges) => {
    dispatch(editors.propertyChange(editorType, editorId, properties));
  };

  const onBlur = (event: FocusEvent<HTMLInputElement>) => {
    const name = event.target.name;
    dispatch(editors.blurField(editorType, editorId, name));
  };

  const onChange = ((val: any, event: ChangeEvent<HTMLInputElement>) => {
    const name = event.target.name;
    onPropertyChange({ [name]: val });
  }) as unknown as CheckboxProps["onChange"]; // TODO(17): see if newer react-md types onChange properly.

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    dispatch(editors.commitEdit(editorType, editorId));
  };

  const onCancel = () => {
    dispatch(goBack());
  };

  const usernameConflictError = onlyFieldError(
    remoteErrors?.fieldErrors.username,
    EntityErrorCodes.USERNAME_TAKEN
  );

  const form = (
    <form onSubmit={onSubmit}>
      <FocusContainer focusOnMount containFocus={false}>
        <CardText>
          <EmailTextField id="email" value={email} disabled />
          <SingleLineTextField
            id="username"
            name="username"
            autocomplete="username"
            label="Username"
            value={username}
            maxLength={schemaSettings.usernameMaxLength}
            onPropertyChange={onPropertyChange}
            onBlur={onBlur}
            disabled={isSubmitting}
            required
            error={
              (blurredFields?.username || wasSubmitAttempted) &&
              (localErrors.username || remoteErrors?.fieldErrors.username)
            }
            errorText={
              <span>
                {localErrors.username &&
                  "Please enter a valid username (letters, numbers, and underscores)."}
                {usernameConflictError?.value === username &&
                  "That username is already registered."}
              </span>
            }
          />
          <PasswordTextField
            id="password"
            name="password"
            autocomplete="new-password"
            value={password}
            minLength={schemaSettings.passwordMinLength}
            maxLength={schemaSettings.passwordMaxLength}
            onPropertyChange={onPropertyChange}
            onBlur={onBlur}
            disabled={isSubmitting}
            required
            error={
              (blurredFields?.password || wasSubmitAttempted) &&
              localErrors.password
            }
            errorText={
              localErrors.password &&
              "Please enter a valid password (6 characters or more)"
            }
          />
          <SingleLineTextField
            id="long-name"
            name="longName"
            autocomplete="name"
            label="Full Name"
            value={longName}
            maxLength={schemaSettings.longNameMaxLength}
            onPropertyChange={onPropertyChange}
            onBlur={onBlur}
            disabled={isSubmitting}
            required
            error={
              (blurredFields?.longName || wasSubmitAttempted) &&
              localErrors.longName
            }
            errorText={localErrors.longName && "Please enter a full name"}
          />
          <SingleLineTextField
            id="short-name"
            name="shortName"
            autocomplete="given-name"
            label="First Name"
            value={shortName}
            maxLength={schemaSettings.shortNameMaxLength}
            onPropertyChange={onPropertyChange}
            onBlur={onBlur}
            disabled={isSubmitting}
            error={
              (blurredFields?.shortName || wasSubmitAttempted) &&
              localErrors.shortName
            }
            errorText={
              localErrors.shortName && "Please enter a preferred first name"
            }
          />
          <Checkbox
            id="does-accept-terms"
            name="doesAcceptTerms"
            checked={doesAcceptTerms}
            value="true"
            onChange={onChange}
            label={
              <div
                className={cn({
                  "error-message":
                    (dirtyFields?.doesAcceptTerms || wasSubmitAttempted) &&
                    localErrors.doesAcceptTerms,
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
          />
          <Checkbox
            id="is-13-years-or-older"
            name="is13YearsOrOlder"
            checked={is13YearsOrOlder}
            value="true"
            onChange={onChange}
            label={
              <div
                className={cn({
                  "error-message":
                    (dirtyFields?.is13YearsOrOlder || wasSubmitAttempted) &&
                    localErrors.is13YearsOrOlder,
                })}
              >
                I am 13 years old or older.
              </div>
            }
          />
          <Checkbox
            id="has-majority-consent"
            name="hasMajorityConsent"
            checked={hasMajorityConsent}
            value="true"
            onChange={onChange}
            label={
              <div
                className={cn({
                  "error-message":
                    (dirtyFields?.hasMajorityConsent || wasSubmitAttempted) &&
                    localErrors.hasMajorityConsent,
                })}
              >
                I am old enough in my local jurisdiction to enter into legal
                agreements and to consent to the processing of my personal data.
              </div>
            }
          />
          <Checkbox
            id="is-not-gdpr"
            name="isNotGdpr"
            checked={isNotGdpr}
            value="true"
            onChange={onChange}
            label={
              <div
                className={cn({
                  "error-message":
                    (dirtyFields?.isNotGdpr || wasSubmitAttempted) &&
                    localErrors.isNotGdpr,
                })}
              >
                I am not located in the European Union (EU), the European
                Economic Area (EEA), or in any other jurisdiction that is
                subject to the General Data Protection Regulation (GDPR).
              </div>
            }
          />
        </CardText>
        <CardActions>
          {isSubmitting && <CircularProgress key="progress" id="progress" />}
          <Button
            flat
            children="Cancel"
            disabled={isSubmitting}
            onClick={onCancel}
          />
          <Button
            raised={isValid}
            flat={!isValid}
            primary={isValid}
            type="submit"
            children="Register"
            disabled={!isValid || isSubmitting}
            title={submitButtonTitle}
            className={cn({
              "md-btn--raised-disabled": !isValid,
              "md-text--disabled": !isValid,
            })}
          />
        </CardActions>
      </FocusContainer>
    </form>
  );

  const confirmedMessage = (
    <React.Fragment>
      <CardText>You are now logged in.</CardText>
      <CardActions>
        <Button
          raised
          primary
          children="Go to recent activity"
          href={paths.recentActivity()}
        />
      </CardActions>
    </React.Fragment>
  );

  let apiErrorMessage;
  if (apiErrorCode) {
    if (apiErrorCode in registrationErrorMessageByCode) {
      apiErrorMessage =
        apiErrorCode &&
        registrationErrorMessageByCode[
          apiErrorCode as keyof typeof registrationErrorMessageByCode
        ];
    }
  }

  const formWithMessage = (
    <>
      <CardText>
        Please enter the following to complete your registration
      </CardText>
      {validationErrorMessage && (
        <CardText className="error-message">{validationErrorMessage}</CardText>
      )}
      {form}
    </>
  );
  const cardContents = (
    <>
      {!didCheckRegistration && (
        <>
          Checking confirmation code…
          <CircularProgress id="checking-registration-code-progress" />
        </>
      )}
      {didCheckRegistration &&
        !isConfirmed &&
        (apiErrorMessage ? apiErrorMessage : formWithMessage)}
      {isConfirmed && confirmedMessage}
    </>
  );
  return makePage(subtitle, cardContents);
}

const makePage = (subtitle: string | undefined, cardContents: JSX.Element) => (
  <div id="register-page">
    <Helmet>
      <title>Complete Registration — Howdju</title>
    </Helmet>
    <div className="md-grid">
      <div className="md-cell md-cell--12">
        <Card>
          <CardTitle title="Complete Registration" subtitle={subtitle} />
          <CardText>{cardContents}</CardText>
        </Card>
      </div>
    </div>
  </div>
);

const subtitleByRegistrationErrorCode = {
  [apiErrorCodes.ENTITY_NOT_FOUND]: "Registration not found",
  [apiErrorCodes.EXPIRED]: "Registration expired",
  [apiErrorCodes.CONSUMED]: "Registration already used",
} as const;

const registrationErrorMessageByCode = {
  [apiErrorCodes.ENTITY_NOT_FOUND]: (
    <CardText>
      That registration could not be found. Please double check the link in the
      confirmation email. If this problem persists, please{" "}
      <Link className="text-link" to={paths.requestRegistration()}>
        register
      </Link>{" "}
      again.
    </CardText>
  ),
  [apiErrorCodes.EXPIRED]: (
    <CardText>
      This registration has expired. Please{" "}
      <Link className="text-link" to={paths.requestRegistration()}>
        register
      </Link>{" "}
      again.
    </CardText>
  ),
  [apiErrorCodes.CONSUMED]: (
    <CardText>
      That registration has already been used. Please{" "}
      <Link className="text-link" to={paths.login()}>
        login
      </Link>
      . If you have forgotten your password, you can{" "}
      <Link className="text-link" to={paths.requestPasswordReset()}>
        reset your password
      </Link>
      . If you don&rsquo;t have access to your password reset email, you can{" "}
      <Link className="text-link" to={paths.requestRegistration()}>
        register
      </Link>{" "}
      again.
    </CardText>
  ),
};
