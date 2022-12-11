import React from "react";
import { toErrorMessage } from "./modelErrorMessages";
import map from "lodash/map";
import {
  IssueFormat,
  errorFormatToString,
  ModelErrorCode,
} from "howdju-common";
import { isArray, isObject, isString } from "lodash";

// TODO support only IssueFormat and remove the others.
type Error = string | ModelErrorCode | IssueFormat | [ModelErrorCode, ...any];
interface Props {
  errors?: Error[];
}

export default function ErrorMessages({ errors }: Props) {
  if (!errors) {
    return null;
  }
  return (
    <ul className="error-message">
      {map(errors, (error) => {
        let firstArg: string;
        let restArgs: any[];
        if (isArray(error)) {
          // An array of ModelErrorCode
          [firstArg, restArgs] = error;
        } else if (isObject(error)) {
          // An IssueFormat

          console.assert(!isArray(error));

          firstArg = errorFormatToString(error);
          restArgs = [];
        } else {
          // A string or ModelErrorCode

          console.assert(isString(error));

          firstArg = error;
          restArgs = [];
        }
        return <li key={firstArg}>{toErrorMessage(firstArg, ...restArgs)}</li>;
      })}
    </ul>
  );
}
