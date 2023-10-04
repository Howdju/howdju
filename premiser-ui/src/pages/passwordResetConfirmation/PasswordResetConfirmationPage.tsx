import { isArray } from "lodash";
import queryString from "query-string";
import React, { useEffect } from "react";
import {
  Card,
  CardActions,
  CardText,
  CardTitle,
  CircularProgress,
} from "react-md";
import { Link, useLocation } from "react-router-dom";

import { makePasswordResetConfirmation } from "howdju-client-common";

import { editors } from "@/actions";
import Helmet from "@/Helmet";
import { useAppDispatch, useAppSelector } from "@/hooks";
import paths from "@/paths";
import PasswordResetConfirmationEditor from "./PasswordResetConfirmationEditor";
import passwordResetConfirmationPage, {
  ErrorCode,
  editorType,
  editorId,
} from "./passwordResetConfirmationPageSlice";
import { combineIds } from "@/viewModels";
import SolidButton from "@/components/button/SolidButton";
import { push } from "connected-react-router";

export default function PasswordResetConfirmationPage() {
  const location = useLocation();
  const queryParams = queryString.parse(location.search);
  const passwordResetCode = queryParams.passwordResetCode;

  if (!passwordResetCode) {
    return <div>passwordResetCode is a required query param.</div>;
  }
  if (isArray(passwordResetCode)) {
    return <div>passwordResetCode must be a single value.</div>;
  }
  return (
    <ValidPasswordResetConfirmationPage passwordResetCode={passwordResetCode} />
  );
}

const id = "password-reset-confirmation-page";

function ValidPasswordResetConfirmationPage({
  passwordResetCode,
}: {
  passwordResetCode: string;
}) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(
      editors.beginEdit(
        editorType,
        editorId,
        makePasswordResetConfirmation({ passwordResetCode })
      )
    );
    dispatch(
      passwordResetConfirmationPage.checkPasswordResetRequestCode(
        passwordResetCode
      )
    );
  }, [dispatch, passwordResetCode]);
  const { email, errorCode, isSubmitted } = useAppSelector(
    (state) => state.passwordResetConfirmationPage
  );

  const subtitle = errorCode ? subtitleByErrorCode[errorCode] : undefined;

  const confirmedMessage = (
    <React.Fragment>
      <CardText>Your password has been changed.</CardText>
      <CardActions>
        <SolidButton onClick={() => dispatch(push(paths.recentActivity()))}>
          Go to recent activity
        </SolidButton>
      </CardActions>
    </React.Fragment>
  );

  const errorMessage = errorCode
    ? passwordResetErrorMessageByCode[errorCode]
    : undefined;

  const form = (
    <React.Fragment>
      <CardText>
        Please change the password for <strong>{email}</strong>
      </CardText>
      <PasswordResetConfirmationEditor
        id={combineIds(id, "editor")}
        editorId={editorId}
      />
    </React.Fragment>
  );

  return (
    <div id="password-reset-confirmation-page">
      <Helmet>
        <title>Password Reset — Howdju</title>
      </Helmet>
      <div className="md-grid">
        <div className="md-cell md-cell--12">
          <Card>
            <CardTitle title="Password Reset" subtitle={subtitle} />
            {!email && (
              <CardText>
                Checking password reset code…
                <CircularProgress id="checking-password-reset-code-progress" />
              </CardText>
            )}
            {errorMessage}
            {email && isSubmitted ? confirmedMessage : form}
          </Card>
        </div>
      </div>
    </div>
  );
}

const subtitleByErrorCode: Record<ErrorCode, string> = {
  ENTITY_NOT_FOUND: "Password reset request not found",
  EXPIRED: "Password reset request expired",
  CONSUMED: "Password reset request already used",
  TIMEOUT: "Password reset request timed out",
  UNKNOWN: "Unknown error",
};

const passwordResetErrorMessageByCode = {
  ENTITY_NOT_FOUND: (
    <CardText>
      That registration could not be found. Please double check the link in the
      confirmation email. If this problem persists, please{" "}
      <Link className="text-link" to={paths.requestRegistration()}>
        register
      </Link>{" "}
      again.
    </CardText>
  ),
  EXPIRED: (
    <CardText>
      This registration has expired. Please{" "}
      <Link className="text-link" to={paths.requestRegistration()}>
        register
      </Link>{" "}
      again.
    </CardText>
  ),
  CONSUMED: (
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
  TIMEOUT: (
    <CardText>
      The password reset request has timed out. Please try again.
    </CardText>
  ),
  UNKNOWN: (
    <CardText>
      The password reset request failed for an unknown reason. Please try again.
    </CardText>
  ),
};
