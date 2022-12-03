import React from "react";
import { toErrorMessage } from "./modelErrorMessages";
import map from "lodash/map";
import {
  ErrorFormat,
  errorFormatToString,
  ModelErrorCode,
} from "howdju-common";
import { isArray, isObject, isString } from "lodash";

// TODO support only ErrorFormat and remove the others.
type Error = string | ModelErrorCode | ErrorFormat | [ModelErrorCode, ...any];
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
          [firstArg, restArgs] = error;
        } else if (isObject(error)) {
          console.assert(!isArray(error));

          firstArg = errorFormatToString(error);
          restArgs = [];
        } else {
          console.assert(isString(error));

          firstArg = error;
          restArgs = [];
        }
        return <li key={firstArg}>{toErrorMessage(firstArg, ...restArgs)}</li>;
      })}
    </ul>
  );
}
