import React from "react";
import map from "lodash/map";
import { isArray, isObject, isString } from "lodash";

import {
  IssueFormat,
  errorFormatToString,
  ModelErrorCode,
  assert,
} from "howdju-common";

import { toErrorMessage } from "./modelErrorMessages";

// TODO(268) support only IssueFormat and remove the others.
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

          assert(!isArray(error));

          firstArg = errorFormatToString(error);
          restArgs = [];
        } else {
          // A string or ModelErrorCode

          assert(isString(error));

          firstArg = error;
          restArgs = [];
        }
        return <li key={firstArg}>{toErrorMessage(firstArg, ...restArgs)}</li>;
      })}
    </ul>
  );
}
