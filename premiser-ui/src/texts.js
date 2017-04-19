import {logError} from "./util";
import isFunction from 'lodash/isFunction'

export const CREATE_STATEMENT_SUBMIT_BUTTON_LABEL = 'CREATE_STATEMENT_SUBMIT_BUTTON_LABEL'
export const CREATE_STATEMENT_SUBMIT_BUTTON_TITLE = 'CREATE_STATEMENT_BUTTON_TITLE'
export const CREATE_STATEMENT_FAILURE_MESSAGE = 'CREATE_STATEMENT_FAILURE_MESSAGE'
export const FETCH_STATEMENT_JUSTIFICATIONS_FAILURE_MESSAGE = 'FETCH_STATEMENT_JUSTIFICATIONS_FAILURE_MESSAGE'
export const LOGIN_SUCCESS_MESSAGE = 'LOGIN_SUCCESS_MESSAGE'

const texts = {
  [CREATE_STATEMENT_SUBMIT_BUTTON_LABEL]: 'Create statement',
  [CREATE_STATEMENT_SUBMIT_BUTTON_TITLE]: 'Tell the world!',
  [CREATE_STATEMENT_FAILURE_MESSAGE]: 'Unable to create statement',
  [FETCH_STATEMENT_JUSTIFICATIONS_FAILURE_MESSAGE]: 'Unable to load justifications',
  [LOGIN_SUCCESS_MESSAGE]: email => `You have logged in as ${email}`,
}

const text = (key, ...args) => {
  const t = texts[key]
  if (!t) {
    logError(`No text key: ${key}`)
    return '';
  }
  return isFunction(t) ? t(...args) : t
}

export default text