import React, { useEffect } from "react";
import { goBack } from "connected-react-router";
import {
  Button,
  Card,
  CardActions,
  CardText,
  CardTitle,
  CircularProgress,
} from "react-md";
import get from "lodash/get";
import moment from "moment";

import {
  makeCreateRegistrationRequestInput,
  RegistrationRequest,
} from "howdju-common";

import Helmet from "../../Helmet";
import { editors } from "../../actions";
import { EditorState, EditorTypes } from "../../reducers/editors";
import { useAppDispatch, useAppSelector } from "@/hooks";
import RegistrationRequestEditor from "./RegistrationRequestEditor";

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
    <RegistrationRequestEditor
      id="registration-request-editor"
      editorId={editorId}
      editorCommitBehavior="JustCommit"
      submitButtonText="Request Registration"
    />
  );

  const isSubmitted = editorState?.isSaved;

  const durationText =
    duration &&
    moment
      .duration(duration.value)
      .format(duration.formatTemplate, { trim: duration.formatTrim });
  const submissionMessage = (
    <React.Fragment>
      <CardText>
        Your registration has been submitted. Please check your email to
        complete your registration. You must complete your registration within{" "}
        {durationText}. If your registration expires, please register again.
      </CardText>
      <CardActions>
        <Button raised primary children="Return" onClick={reset} />
      </CardActions>
    </React.Fragment>
  );

  return (
    <div id="register-page">
      <Helmet>
        <title>Request Registration — Howdju</title>
      </Helmet>
      <div className="md-grid">
        <div className="md-cell md-cell--12">
          <Card>
            <CardTitle title="Request Registration" />
            {isSubmitted ? submissionMessage : form}
          </Card>
        </div>
      </div>
    </div>
  );
}
