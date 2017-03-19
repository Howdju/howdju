export const CREATE_STATEMENT = 'CREATE_STATEMENT'
export const JUSTIFY_STATEMENT = 'JUSTIFY_STATEMENT'
export const CREATE_JUSTIFIED_STATEMENT = 'CREATE_JUSTIFIED_STATEMENT'
export const ACCEPT_JUSTIFICATION = 'ACCEPT_JUSTIFICATION'
export const REJECT_JUSTIFICATION = 'REJECT_JUSTIFICATION'

export function createStatement(text) {
  return { type: CREATE_STATEMENT, payload: { text }}
}

export function justifyStatement(statementId, justification) {
  return { type: JUSTIFY_STATEMENT, payload: { statementId, justification }}
}

export function createJustifiedStatement(statement, justifications) {
  return { type: CREATE_JUSTIFIED_STATEMENT, payload: { statement, justifications }}
}

export function acceptJustification(justificationId) {
  return { type: ACCEPT_JUSTIFICATION, payload: { justificationId }}
}

export function rejectJustification(justificationId) {
  return { type: REJECT_JUSTIFICATION, payload: { justificationId }}
}