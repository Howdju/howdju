import React, { useEffect } from "react";
import { goBack } from "connected-react-router";
import get from "lodash/get";
import moment from "moment";

import {
  makeCreateRegistrationRequestInput,
  RegistrationRequest,
} from "howdju-common";

import { CircularProgress } from "@/components/progress/CircularProgress";
import { Card, CardActions, CardContent } from "@/components/card/Card";
import Helmet from "../../Helmet";
import { editors } from "../../actions";
import { EditorState, EditorTypes } from "../../reducers/editors";
import { useAppDispatch, useAppSelector } from "@/hooks";
import RegistrationRequestEditor from "./RegistrationRequestEditor";
import SolidButton from "@/components/button/SolidButton";
import SingleColumnGrid from "@/components/layout/SingleColumnGrid";

const editorId = "registration-request-page";
const editorType = EditorTypes.REGISTRATION_REQUEST;

export default function RegistrationRequestPage() {
  const dispatch = useAppDispatch();

  const reset = () => {
    dispatch(goBack());
  };

  useEffect(() => {
    dispatch(
      editors.beginEdit(
        editorType,
        editorId,
        makeCreateRegistrationRequestInput()
      )
    );
  }, [dispatch]);

  const editorState = useAppSelector((state) =>
    get(state, ["editors", editorType, editorId])
  ) as EditorState<RegistrationRequest>;

  if (!editorState) {
    return <CircularProgress id={editorId} />;
  }

  const duration = get(editorState, "duration");

  const form = (
    <CardContent>
      <RegistrationRequestEditor
        id="registration-request-editor"
        editorId={editorId}
        commitBehavior="JustCommit"
        submitButtonText="Request Registration"
      />
    </CardContent>
  );

  const isSubmitted = editorState?.isSaved;

  const durationText =
    duration &&
    moment
      .duration(duration.value)
      .format(duration.formatTemplate, { trim: duration.formatTrim });
  const submissionMessage = (
    <React.Fragment>
      <CardContent>
        Your registration has been submitted. Please check your email to
        complete your registration. You must complete your registration within{" "}
        {durationText}. If your registration expires, please register again.
      </CardContent>
      <CardActions>
        <SolidButton children="Return" onClick={reset} />
      </CardActions>
    </React.Fragment>
  );

  return (
    <div id="register-page">
      <Helmet>
        <title>Request Registration — Howdju</title>
      </Helmet>
      <SingleColumnGrid>
        <Card title="Request Registration">
          {isSubmitted ? submissionMessage : form}
        </Card>
      </SingleColumnGrid>
    </div>
  );
}
