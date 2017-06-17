import {logError} from "./util";
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
  [modelErrorCodes.MUST_BE_NONEMPTY]: 'Must be non-empty',
  [modelErrorCodes.IS_REQUIRED]: 'Is required',
  [modelErrorCodes.IF_PRESENT_MUST_BE_ARRAY]: 'Must be array',
  [modelErrorCodes.INVALID_URL]: 'Invalid URL',
  [modelErrorCodes.STATEMENT_JUSTIFICATION_MUST_HAVE_STATEMENT_TARGET_TYPE]: "Statement's justification must have STATEMENT target type",
}

export const toErrorMessage = (modelErrorCode, ...args) => {
  const t = modelErrorMessages[modelErrorCode]
  if (!t) {
    logError(`No modelErrorMessages key: ${modelErrorCode}`)
    return '';
  }
  return isFunction(t) ? t(...args) : t
}

export const toErrorText = (modelErrorCodes) => capitalize(join(map(modelErrorCodes, toErrorMessage), ', '))
