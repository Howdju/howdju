import React, { useEffect } from "react";
import get from "lodash/get";
import queryString from "query-string";
import { isArray } from "lodash";
import { useLocation } from "react-router";

import {
  apiErrorCodes,
  logger,
  makeCreateRegistrationConfirmationInput,
  RegistrationConfirmation,
} from "howdju-common";

import { CircularProgress } from "@/components/progress/CircularProgress";
import { Card, CardActions, CardContent } from "@/components/card/Card";
import Helmet from "../../Helmet";
import { api, editors } from "../../actions";
import Link from "../../Link";
import paths from "../../paths";
import { EditorState, EditorTypes } from "../../reducers/editors";
import {
  selectDidCheckRegistration,
  selectRegistrationErrorCode,
  selectRegistrationEmail,
} from "../../selectors";
import { useAppDispatch, useAppSelector } from "@/hooks";
import RegistrationConfirmationEditor from "./RegistrationConfirmationEditor";
import SolidButton from "@/components/button/SolidButton";
import SingleColumnGrid from "@/components/layout/SingleColumnGrid";
import { Page } from "@/components/layout/Page";

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

  const isConfirmed = editorState?.isSaved;

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

  const form = (
    <RegistrationConfirmationEditor
      id="registration-confirmation-editor"
      editorId={editorId}
      commitBehavior="JustCommit"
      submitButtonText="Complete Registration"
      email={email}
    />
  );

  const confirmedMessage = (
    <React.Fragment>
      <CardContent>You are now logged in.</CardContent>
      <CardActions>
        <SolidButton href={paths.recentActivity()}>
          Go to recent activity
        </SolidButton>
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
      <CardContent>
        Please enter the following to complete your registration
      </CardContent>
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
  <Page id="register-page">
    <Helmet>
      <title>Complete Registration — Howdju</title>
    </Helmet>
    <SingleColumnGrid>
      <Card title="Complete Registration" subtitle={subtitle}>
        <CardContent>{cardContents}</CardContent>
      </Card>
    </SingleColumnGrid>
  </Page>
);

const subtitleByRegistrationErrorCode = {
  [apiErrorCodes.ENTITY_NOT_FOUND]: "Registration not found",
  [apiErrorCodes.EXPIRED]: "Registration expired",
  [apiErrorCodes.CONSUMED]: "Registration already used",
} as const;

const registrationErrorMessageByCode = {
  [apiErrorCodes.ENTITY_NOT_FOUND]: (
    <CardContent>
      That registration could not be found. Please double check the link in the
      confirmation email. If this problem persists, please{" "}
      <Link className="text-link" to={paths.requestRegistration()}>
        register
      </Link>{" "}
      again.
    </CardContent>
  ),
  [apiErrorCodes.EXPIRED]: (
    <CardContent>
      This registration has expired. Please{" "}
      <Link className="text-link" to={paths.requestRegistration()}>
        register
      </Link>{" "}
      again.
    </CardContent>
  ),
  [apiErrorCodes.CONSUMED]: (
    <CardContent>
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
    </CardContent>
  ),
};
