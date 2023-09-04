import React, { useEffect } from "react";
import { Button, Card, CardActions, CardText, CardTitle } from "react-md";
import moment from "moment";

import { makeCreatePasswordResetRequestInput } from "howdju-client-common";

import Helmet from "@/Helmet";
import { useAppDispatch, useAppSelector } from "@/hooks";
import { editors } from "@/actions";
import PasswordResetRequestEditor from "./PasswordResetRequestEditor";
import passwordResetRequestPage, {
  editorType,
  editorId,
} from "./passwordResetRequestPageSlice";
import { combineIds } from "@/viewModels";
import ErrorMessages from "@/ErrorMessages";

const id = "password-reset-request-page";

export default function PasswordResetRequestPage() {
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(
      editors.beginEdit(
        editorType,
        editorId,
        makeCreatePasswordResetRequestInput()
      )
    );
  }, [dispatch]);

  const form = (
    <PasswordResetRequestEditor
      id={combineIds(id, "editor")}
      editorId={editorId}
    />
  );
  const { duration, errorCode } = useAppSelector(
    (state) => state.passwordResetRequestPage
  );

  const durationText =
    duration &&
    moment
      .duration(duration.value)
      .format(duration.formatTemplate, { trim: duration.formatTrim });
  const submissionMessage = durationText ? (
    <React.Fragment>
      <CardText>
        Please check your email to complete your password reset. You must
        complete the password reset within {durationText}. If your password
        reset expires, please request a password reset again.
      </CardText>
      <CardActions>
        <Button
          raised
          primary
          children="Return"
          onClick={() => dispatch(passwordResetRequestPage.reset())}
        />
      </CardActions>
    </React.Fragment>
  ) : undefined;
  const errorMessage = errorCode ? (
    <ErrorMessages errors={[errorMessageByErrorCode[errorCode]]} />
  ) : undefined;

  return (
    <div id="password-reset-page">
      <Helmet>
        <title>Request Password Reset — Howdju</title>
      </Helmet>
      <div className="md-grid">
        <div className="md-cell md-cell--12">
          <Card>
            <CardTitle title="Request Password Reset" />
            {errorMessage}
            {submissionMessage ?? form}
          </Card>
        </div>
      </div>
    </div>
  );
}

const errorMessageByErrorCode: Record<string, string> = {
  ENTITY_NOT_FOUND: "User not found",
  TIMEOUT: "Request timed out",
  UNKNOWN: "Unknown error",
};
