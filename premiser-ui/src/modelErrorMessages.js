import isFunction from 'lodash/isFunction'
import capitalize from 'lodash/capitalize'
import join from 'lodash/join'
import map from 'lodash/map'

import {
  modelErrorCodes,
  entityConflictCodes,
  userActionsConflictCodes,
  authorizationErrorCodes,
} from 'howdju-common'

import {logger} from './logger'

const modelErrorMessages = {
  [modelErrorCodes.MUST_BE_NONEMPTY]: 'Must be non-empty',
  [modelErrorCodes.IS_REQUIRED]: 'Is required',
  [modelErrorCodes.IF_PRESENT_MUST_BE_ARRAY]: 'Must be array',
  [modelErrorCodes.INVALID_URL]: 'Invalid URL',
  [modelErrorCodes.STATEMENT_JUSTIFICATION_MUST_HAVE_STATEMENT_TARGET_TYPE]: "Statement's justification must have STATEMENT target type",

  [entityConflictCodes.ANOTHER_STATEMENT_HAS_EQUIVALENT_TEXT]: 'Another statement already has equivalent text',
  [entityConflictCodes.ANOTHER_WRIT_QUOTE_HAS_EQUIVALENT_QUOTE_TEXT]: 'That quote from that source already exists',
  [entityConflictCodes.ANOTHER_WRIT_HAS_EQUIVALENT_TITLE]: 'That source already exists',

  [authorizationErrorCodes.CANNOT_MODIFY_OTHER_USERS_ENTITIES]: "Cannot modify another user's entities",

  [userActionsConflictCodes.OTHER_USERS_HAVE_ROOTED_JUSTIFICATIONS_IN_THIS_STATEMENT]:
    'Other users have already created justifications rooted in this statement',
  [userActionsConflictCodes.OTHER_USERS_HAVE_BASED_JUSTIFICATIONS_ON_THIS_STATEMENT]:
    'Other users have based justifications on this statement',
  [userActionsConflictCodes.OTHER_USERS_HAVE_BASED_JUSTIFICATIONS_ON_THIS_WRIT_QUOTE]:
    'Other users have already based justifications on this quote',
  [userActionsConflictCodes.OTHER_USERS_HAVE_BASED_JUSTIFICATIONS_ON_THIS_WRIT]:
    'Other users have already based justifications on this source',
  [userActionsConflictCodes.OTHER_USERS_HAVE_VOTED_ON_JUSTIFICATIONS_ROOTED_IN_THIS_STATEMENT]:
    'Other users have already voted on justifications rooted in this statement',
  [userActionsConflictCodes.OTHER_USERS_HAVE_VOTED_ON_JUSTIFICATIONS_BASED_ON_THIS_WRIT_QUOTE]:
    'Other users have already voted on justifications using this quote',
  [userActionsConflictCodes.OTHER_USERS_HAVE_VOTED_ON_JUSTIFICATIONS_BASED_ON_THIS_WRIT]:
    'Other users have already verified justification based on this source',
  [userActionsConflictCodes.OTHER_USERS_HAVE_COUNTERED_JUSTIFICATIONS_BASED_ON_THIS_WRIT_QUOTE]:
    'Other users have already countered justifications based on this quote',
  [userActionsConflictCodes.OTHER_USERS_HAVE_COUNTERED_JUSTIFICATIONS_BASED_ON_THIS_WRIT]:
    'Other users have already countered justifications based on this source',
}

export const toErrorMessage = (modelErrorCode, ...args) => {
  const t = modelErrorMessages[modelErrorCode]
  if (!t) {
    logger.error(`No modelErrorMessages key: ${modelErrorCode}`)
    return ''
  }
  return isFunction(t) ? t(...args) : t
}

export const toErrorText = (modelErrorCodes) => capitalize(join(map(modelErrorCodes, toErrorMessage), ', '))
