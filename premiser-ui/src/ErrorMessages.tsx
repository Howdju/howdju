import React from "react";
import { toErrorMessage } from "./modelErrorMessages";
import map from "lodash/map";
import { ErrorFormat, ModelErrorCode } from "howdju-common";
import { isArray, isObject, isString, startCase, toString } from "lodash";

// TODO support only ErrorFormat and remove the others.
type Error = string | ModelErrorCode | ErrorFormat | [ModelErrorCode, ...any];
interface Props {
  errors?: Error[];
}

function errorFormatToString(errorFormat: ErrorFormat): string {
  switch (errorFormat.code) {
    case "invalid_type": {
      const { received, message } = errorFormat;
      if (received === "undefined" && message === "Required") {
        // TODO: if name is a number, then keep going backwards through path until we get to a
        // string. Keep track of the numbers, and then add them after the string. So `["prop", 1, 2]`
        // would become `prop[1][2]`.
        const name = toString(errorFormat.path[errorFormat.path.length - 1]);
        const casedName = startCase(name);
        return `${casedName} is required`;
      }
      return errorFormat.message;
    }
    default:
      return errorFormat.message;
  }
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
