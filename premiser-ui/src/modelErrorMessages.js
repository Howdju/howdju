import isFunction from 'lodash/isFunction'
import capitalize from 'lodash/capitalize'
import join from 'lodash/join'
import map from 'lodash/map'
import {logger} from './logger'

const modelErrorMessages = {
  MUST_BE_NONEMPTY: 'Must be non-empty',
  IS_REQUIRED: 'Is required',
  IF_PRESENT_MUST_BE_ARRAY: 'Must be array',
  INVALID_URL: 'Invalid URL',
  STATEMENT_JUSTIFICATION_MUST_HAVE_STATEMENT_TARGET_TYPE: "Statement's justification must have STATEMENT target type",
  OTHER_STATEMENTS_HAVE_EQUIVALENT_TEXT_CONFLICT: 'Another statement already has equivalent text',
  OTHER_CITATION_REFERENCES_HAVE_SAME_CITATION_QUOTE_CONFLICT: 'Another citation reference already has the same citation and quote',
  OTHER_CITATIONS_HAVE_EQUIVALENT_TEXT_CONFLICT: 'Another citation already has equivalent text',
  CANNOT_MODIFY_OTHER_USERS_ENTITIES: "Cannot modify another user's entities",

  OTHER_USERS_HAVE_CREATED_JUSTIFICATIONS_ROOTED_IN_THIS_STATEMENT: 'Other users have created justifications rooted in this statement',
  OTHER_USERS_HAVE_VOTED_ON_JUSTIFICATIONS_ROOTED_IN_THIS_STATEMENT: 'Other users have voted on justifications rooted in this statement',
  OTHER_USERS_HAVE_BASED_JUSTIFICATIONS_ON_THIS_STATEMENT: 'Other users have based justifications on this statement',
  OTHER_USERS_HAVE_VERIFIED_JUSTIFICATIONS_BASED_ON_THIS_CITATION_REFERENCE_CONFLICT: 'Other users have verified justifications based on this quote',
  OTHER_USERS_HAVE_CREATED_JUSTIFICATIONS_USING_THIS_CITATION_REFERENCE_CONFLICT: 'Other users have created justifications using this quote',
  OTHER_USERS_HAVE_VERIFIED_JUSTIFICATIONS_BASED_ON_THIS_CITATION_CONFLICT: 'Other users have verified justifications based upon this citation',
  OTHER_USERS_HAVE_CREATED_JUSTIFICATIONS_USING_THIS_CITATION_CONFLICT: 'Other users have created justifications based upon this citation',
  OTHER_USERS_HAVE_COUNTERED_JUSTIFICATIONS_BASED_ON_THIS_CITATION_REFERENCE_CONFLICT: 'Other users have countered justifications based upon this quote',
  OTHER_USERS_HAVE_COUNTERED_JUSTIFICATIONS_BASED_ON_THIS_CITATION_CONFLICT: 'Other users have countered justifications based upon this citation',
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
