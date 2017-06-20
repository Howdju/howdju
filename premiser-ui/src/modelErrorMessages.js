import isFunction from 'lodash/isFunction'
import capitalize from 'lodash/capitalize'
import join from 'lodash/join'
import map from 'lodash/map'

const modelErrorCodes = {
  MUST_BE_NONEMPTY: 'MUST_BE_NONEMPTY',
  IS_REQUIRED: 'IS_REQUIRED',
  IF_PRESENT_MUST_BE_ARRAY: 'IF_PRESENT_MUST_BE_ARRAY',
  INVALID_URL: 'INVALID_URL',
  STATEMENT_JUSTIFICATION_MUST_HAVE_STATEMENT_TARGET_TYPE: 'STATEMENT_JUSTIFICATION_MUST_HAVE_STATEMENT_TARGET_TYPE',
}

const modelErrorMessages = {
  MUST_BE_NONEMPTY: 'Must be non-empty',
  IS_REQUIRED: 'Is required',
  IF_PRESENT_MUST_BE_ARRAY: 'Must be array',
  INVALID_URL: 'Invalid URL',
  STATEMENT_JUSTIFICATION_MUST_HAVE_STATEMENT_TARGET_TYPE: "Statement's justification must have STATEMENT target type",
  OTHER_STATEMENTS_HAVE_SAME_TEXT_CONFLICT: 'Another statement already has the same text',
  OTHER_CITATION_REFERENCES_HAVE_SAME_CITATION_QUOTE_CONFLICT: 'Another citation reference already has the same citation and quote',
  OTHER_CITATIONS_HAVE_SAME_TEXT_CONFLICT: 'Another citation already has the same text',
}

export const toErrorMessage = (modelErrorCode, ...args) => {
  const t = modelErrorMessages[modelErrorCode]
  if (!t) {
    logger.error(`No modelErrorMessages key: ${modelErrorCode}`)
    return '';
  }
  return isFunction(t) ? t(...args) : t
}

export const toErrorText = (modelErrorCodes) => capitalize(join(map(modelErrorCodes, toErrorMessage), ', '))
