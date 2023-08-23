import {
  captureMessage as sentryCaptureMessage,
  setUser,
  configureScope,
  captureException as sentryCaptureException,
} from "@sentry/browser";
import { CaptureContext, Extras, SeverityLevel, User } from "@sentry/types";

export const captureMessage = (
  message: string,
  captureContext?: CaptureContext | SeverityLevel | undefined
) => sentryCaptureMessage(message, captureContext);
export const setUserContext = (sentryExternalId: string) => {
  const user: User = { id: sentryExternalId };
  setUser(user);
};

export const clearUserContext = () => {
  configureScope((scope) => scope.setUser(null));
};

export const captureException = (err: any, extra?: Extras) => {
  const captureContext = extra ? { extra } : undefined;
  return sentryCaptureException(err, captureContext);
};
