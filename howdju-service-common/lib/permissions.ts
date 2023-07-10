export const permissions = {
  EDIT_ANY_ENTITY: "EDIT_ANY_ENTITY",
  CREATE_USERS: "CREATE_USERS",
} as const;
export type Permission = keyof typeof permissions;
