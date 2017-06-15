import * as httpStatusCodes from './httpStatusCodes'
import {
  default as t,
  YOU_LACK_PERMISSION_TO_PERFORM_THAT_ACTION,
  ERROR_FETCHING_STATEMENT, ERROR_CREATING_STATEMENT, ERROR_UPDATING_STATEMENT,
  A_STATEMENT_WITH_THAT_TEXT_ALREADY_EXISTS,
  CANNOT_MODIFY_A_STATEMENT_AFTER_OTHER_USERS_HAVE_ADDED_JUSTIFICATIONS_OR_VERIFIED_IT,
} from './texts'

export const activityKeys = {
  CREATE_STATEMENT: 'CREATE_STATEMENT',
  UPDATE_STATEMENT: 'UPDATE_STATEMENT',
  FETCH_STATEMENT: 'FETCH_STATEMENT',
}

export const makeMessage = (activityKey, params) => {
  switch (activityKey) {
    case activityKeys.CREATE_STATEMENT: {
      return t(ERROR_CREATING_STATEMENT)
    }
    case activityKeys.UPDATE_STATEMENT: {
      switch (params.status) {
        case httpStatusCodes.FORBIDDEN:
          return t(YOU_LACK_PERMISSION_TO_PERFORM_THAT_ACTION)
        case httpStatusCodes.ENTITY_CONFLICT:
          return t(A_STATEMENT_WITH_THAT_TEXT_ALREADY_EXISTS)
        case httpStatusCodes.USER_ACTIONS_CONFLICT:
          return t(CANNOT_MODIFY_A_STATEMENT_AFTER_OTHER_USERS_HAVE_ADDED_JUSTIFICATIONS_OR_VERIFIED_IT)
      }
      if (params.status >= 400) {
        return t(ERROR_UPDATING_STATEMENT)
      }
      break;
    }
    case activityKeys.FETCH_STATEMENT: {
      return t(ERROR_FETCHING_STATEMENT)
    }
  }
  return null
}