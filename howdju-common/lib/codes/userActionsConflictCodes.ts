/** I'm not sure what benefit there is separating these from entityConflictCodes */
export const userActionsConflictCodes = {
  OTHER_USERS_HAVE_ROOTED_JUSTIFICATIONS_IN_THIS_PROPOSITION:
    "OTHER_USERS_HAVE_ROOTED_JUSTIFICATIONS_IN_THIS_PROPOSITION",
  OTHER_USERS_HAVE_BASED_JUSTIFICATIONS_ON_THIS_PROPOSITION:
    "OTHER_USERS_HAVE_BASED_JUSTIFICATIONS_ON_THIS_PROPOSITION",
  OTHER_USERS_HAVE_BASED_JUSTIFICATIONS_ON_THIS_WRIT_QUOTE:
    "OTHER_USERS_HAVE_BASED_JUSTIFICATIONS_ON_THIS_WRIT_QUOTE",
  OTHER_USERS_HAVE_BASED_JUSTIFICATIONS_ON_THIS_WRIT:
    "OTHER_USERS_HAVE_BASED_JUSTIFICATIONS_ON_THIS_WRIT",
  OTHER_USERS_HAVE_VOTED_ON_JUSTIFICATIONS_ROOTED_IN_THIS_PROPOSITION:
    "OTHER_USERS_HAVE_VOTED_ON_JUSTIFICATIONS_ROOTED_IN_THIS_PROPOSITION",
  OTHER_USERS_HAVE_VOTED_ON_JUSTIFICATIONS_BASED_ON_THIS_WRIT_QUOTE:
    "OTHER_USERS_HAVE_VOTED_ON_JUSTIFICATIONS_BASED_ON_THIS_WRIT_QUOTE",
  OTHER_USERS_HAVE_VOTED_ON_JUSTIFICATIONS_BASED_ON_THIS_WRIT:
    "OTHER_USERS_HAVE_VOTED_ON_JUSTIFICATIONS_BASED_ON_THIS_WRIT",
  OTHER_USERS_HAVE_COUNTERED_JUSTIFICATIONS_BASED_ON_THIS_WRIT_QUOTE:
    "OTHER_USERS_HAVE_COUNTERED_JUSTIFICATIONS_BASED_ON_THIS_WRIT_QUOTE",
  OTHER_USERS_HAVE_COUNTERED_JUSTIFICATIONS_BASED_ON_THIS_WRIT:
    "OTHER_USERS_HAVE_COUNTERED_JUSTIFICATIONS_BASED_ON_THIS_WRIT",
} as const;
export type UserActionsConflictCode =
  typeof userActionsConflictCodes[keyof typeof userActionsConflictCodes];
