import React, { MouseEvent, useState } from "react";
import {
  Card,
  CardActions,
  CardText,
  CardTitle,
  FocusContainer,
  SelectField,
} from "react-md";

import SingleLineTextField from "./SingleLineTextField";
import * as sentry from "./sentry";
import { PropertyChanges } from "./types";
import { ListValue } from "react-md/lib/SelectFields/SelectField";
import { toString } from "lodash";
import { SeverityLevel } from "@sentry/browser";
import OutlineButton from "./components/button/OutlineButton";

const LEVELS = [
  {
    label: "Fatal",
    value: "fatal",
  },
  {
    label: "Error",
    value: "error",
  },
  {
    label: "Warning",
    value: "warning",
  },
  {
    label: "Log",
    value: "log",
  },
  {
    label: "Info",
    value: "info",
  },
  {
    label: "Debug",
    value: "debug",
  },
];

export default function TestErrorPage() {
  const [state, setState] = useState({
    message: "",
    level: "error" as SeverityLevel,
  });

  function onMessageChange({ message }: PropertyChanges) {
    setState((state) => ({ ...state, message }));
  }

  function onLevelChange(value: ListValue) {
    const level = toString(value) as SeverityLevel;
    setState((state) => ({ ...state, level }));
  }

  function onCreateMessage(event: MouseEvent) {
    event.preventDefault();
    sentry.captureMessage(`Test message: ${state.message}`, state.level);
  }

  function onCreateError(event: MouseEvent) {
    event.preventDefault();
    throw new Error(`Test error: ${state.message}`);
  }

  const { message, level } = state;
  return (
    <Card>
      <CardTitle title="Test error" />
      <FocusContainer focusOnMount containFocus={false}>
        <CardText>
          <SingleLineTextField
            name="message"
            value={message}
            required
            onPropertyChange={onMessageChange}
          />
          <SelectField
            id="level"
            label="Level"
            value={level}
            onChange={onLevelChange}
            menuItems={LEVELS}
          />
        </CardText>
        <CardActions>
          <OutlineButton disabled={!message} onClick={onCreateError}>
            Create test error
          </OutlineButton>
          <OutlineButton disabled={!message} onClick={onCreateMessage}>
            Create test message
          </OutlineButton>
        </CardActions>
      </FocusContainer>
    </Card>
  );
}
