export const clientNetworkErrorTypes = {
  NETWORK_FAILURE_ERROR: "NETWORK_FAILURE_ERROR",
  API_RESPONSE_ERROR: "API_RESPONSE_ERROR",
  REQUEST_CONFIGURATION_ERROR: "REQUEST_CONFIGURATION_ERROR",
  COMMIT_EDIT_RESULT_ERROR: "COMMIT_EDIT_RESULT_ERROR",
  INVALID_URL: "INVALID_URL",
};
export type ClientNetworkErrorType =
  typeof clientNetworkErrorTypes[keyof typeof clientNetworkErrorTypes];
