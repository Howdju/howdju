import { HttpStatusCode } from "axios";
import {
  ActionCreatorWithPreparedPayload,
  PayloadAction,
} from "@reduxjs/toolkit";

import { ApiErrorCode } from "howdju-common";

import { ClientNetworkErrorType } from "@/clientNetworkErrors";
import { createAction } from "./actionHelpers";

// Created by newApiResponseError.
export type ApiErrorResponsePayload = {
  errorType: "API_RESPONSE_ERROR";
  message: string;
  sourceError: Error;
  httpStatusCode: HttpStatusCode;
  body: {
    errorCode: ApiErrorCode;
  };
};
/**
 * A callApiResponse payload may be a local error (e.g. network) or it
 * can be a response from the API.
 */
export type CallApiErrorResponsePayload =
  | {
      errorType: Omit<ClientNetworkErrorType, "API_RESPONSE_ERROR">;
      message: string;
      sourceError: Error;
    }
  | ApiErrorResponsePayload;

export const callApiResponse = createAction(
  "CALL_API_RESPONSE",
  (result) => result
) as
  | ActionCreatorWithPreparedPayload<
      unknown[], // Args
      CallApiErrorResponsePayload, // Payload
      string, // Type
      true, // Error
      unknown // Meta
    >
  | ActionCreatorWithPreparedPayload<
      unknown[], // Args
      unknown, // Payload
      string, // Type
      false, // Error
      unknown // Meta
    >;

export function isApiResponseErrorAction(
  action: ReturnType<typeof callApiResponse>
): action is PayloadAction<ApiErrorResponsePayload, string, unknown, boolean> {
  return action.error && action.payload.errorType === "API_RESPONSE_ERROR";
}
