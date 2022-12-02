export const authorizationErrorCodes = {
  CANNOT_MODIFY_OTHER_USERS_ENTITIES: "CANNOT_MODIFY_OTHER_USERS_ENTITIES",
} as const;
export type AuthorizationErrorCode =
  typeof authorizationErrorCodes[keyof typeof authorizationErrorCodes];
