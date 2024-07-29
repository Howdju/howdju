import React, { useEffect } from "react";
import moment from "moment";

import { makeCreatePasswordResetRequestInput } from "howdju-client-common";

import { Card, CardActions, CardContent } from "@/components/card/Card";
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
import SolidButton from "@/components/button/SolidButton";
import SingleColumnGrid from "@/components/layout/SingleColumnGrid";
import { Page } from "@/components/layout/Page";

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
      <CardContent>
        Please check your email to complete your password reset. You must
        complete the password reset within {durationText}. If your password
        reset expires, please request a password reset again.
      </CardContent>
      <CardActions>
        <SolidButton onClick={() => dispatch(passwordResetRequestPage.reset())}>
          Return
        </SolidButton>
      </CardActions>
    </React.Fragment>
  ) : undefined;
  const errorMessage = errorCode ? (
    <ErrorMessages errors={[errorMessageByErrorCode[errorCode]]} />
  ) : undefined;

  return (
    <Page id="password-reset-page">
      <Helmet>
        <title>Request Password Reset — Howdju</title>
      </Helmet>
      <h1>Request Password Reset</h1>
      <SingleColumnGrid>
        <Card title="Request Password Reset">
          <CardContent>
            {errorMessage}
            {submissionMessage ?? form}
          </CardContent>
        </Card>
      </SingleColumnGrid>
    </Page>
  );
}

const errorMessageByErrorCode: Record<string, string> = {
  ENTITY_NOT_FOUND: "User not found",
  TIMEOUT: "Request timed out",
  UNKNOWN: "Unknown error",
};
