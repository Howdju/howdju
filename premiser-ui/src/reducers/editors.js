import has from 'lodash/has'
import forEach from 'lodash/forEach'
import cloneDeep from 'lodash/cloneDeep'
import set from 'lodash/set'
import assign from 'lodash/assign'
import get from 'lodash/get'
import reduce from 'lodash/reduce'
import merge from 'lodash/merge'
import includes from 'lodash/includes'
import clone from 'lodash/clone'
import { handleActions } from 'redux-actions'

import {
  api,
  editors
} from "../actions"
import {justificationBasisTypeToNewJustificationBasisMemberName, makeNewStatementAtom, makeNewUrl} from "../models";
import * as apiErrorCodes from "../apiErrorCodes";
import {customErrorTypes, newProgrammingError} from "../customErrors";
import {default as t, INVALID_LOGIN_CREDENTIALS, UNABLE_TO_LOGIN} from "../texts";

const EditorActions = reduce(editors, (editorActions, actionCreator) => {
  editorActions[actionCreator] = true
  // Include the result action too, if present
  if (actionCreator.result) {
    editorActions[actionCreator.result] = true
  }
  return editorActions
}, {})

export const EditorTypes = {
  DEFAULT: 'DEFAULT',
  STATEMENT: 'STATEMENT',
  STATEMENT_COMPOUND: 'STATEMENT_COMPOUND',
  CITATION_REFERENCE: 'CITATION_REFERENCE',
  COUNTER_JUSTIFICATION: 'COUNTER_JUSTIFICATION',
  /* e.g. new justification dialog */
  NEW_JUSTIFICATION: 'NEW_JUSTIFICATION',
  /* e.g. Statement justification page */
  STATEMENT_JUSTIFICATION: 'STATEMENT_JUSTIFICATION',
  LOGIN_CREDENTIALS: 'LOGIN_CREDENTIALS',
}

const defaultEditorState = {}

const editorErrorReducer = errorKey => (state, action) => {
  const sourceError = action.payload.sourceError
  if (sourceError.errorType === customErrorTypes.API_RESPONSE_ERROR) {
    const responseBody = sourceError.body
    if (includes([
          apiErrorCodes.VALIDATION_ERROR,
          apiErrorCodes.ENTITY_CONFLICT,
          apiErrorCodes.USER_ACTIONS_CONFLICT,
          apiErrorCodes.AUTHORIZATION_ERROR,
        ], responseBody.errorCode)) {
      const errors = responseBody.errors[errorKey]
      return {...state, errors, isSaving: false}
    }
  }
  return state
}

/** Reducers that separate the behavior from the state so that it is possible to have independent states updating according
 * to the same rules.  The editor type determines the rules that update the state, the editor type and editor ID identify
 * the state.
 */
const editorReducerByType = {

  [EditorTypes.DEFAULT]: handleActions({
    [editors.init]: (state, action) => {
      return state === defaultEditorState ? action.payload.initialState : state
    },
    [editors.beginEdit]: (state, action) => {
      const {entity} = action.payload
      const editEntity = cloneDeep(entity)
      return {...state, editEntity}
    },
    [editors.propertyChange]: (state, action) => {
      const editEntity = cloneDeep(state.editEntity)
      const properties = action.payload.properties
      forEach(properties, (val, key) => {
        set(editEntity, key, val)
      })
      return {...state, editEntity, errors: null}
    },
    [editors.commitEdit]: (state, action) => ({...state, isSaving: true, errors: null}),
    [editors.commitEdit.result]: {
      next: (state, action) => ({...state, isSaving: false, editEntity: null}),
      throw: (state, action) => {
        const sourceError = action.payload.sourceError
        if (sourceError.errorType === customErrorTypes.API_RESPONSE_ERROR) {
          const responseBody = sourceError.body
          if (responseBody.errorCode === apiErrorCodes.VALIDATION_ERROR) {
            return {...state, isSaving: false, errors: responseBody.errors}
          }
        }

        return {...state, isSaving: false}
      }
    },
    [editors.cancelEdit]: (state, action) => ({...state, editEntity: null}),
  }, defaultEditorState),

  [EditorTypes.STATEMENT]: handleActions({
    [api.fetchStatementJustifications]: (state, action) => {
      if (state.entityId === action.payload.statementId) {
        return {...state, isFetching: true}
      }
      return state
    },
    [api.fetchStatement]: (state, action) => {
      if (state.entityId === action.payload.statementId) {
        return {...state, isFetching: true}
      }
      return state
    },
    [api.fetchStatementJustifications.response]: (state, action) => {
      if (state.entityId === action.meta.requestPayload.statementId) {
        return {...state, isFetching: false}
      }
      return state
    },
    [api.fetchStatement.response]: (state, action) => {
      if (state.entityId === action.meta.requestPayload.statementId) {
        return {...state, isFetching: false}
      }
      return state
    },
    [editors.commitEdit.result]: {
      throw: editorErrorReducer('statement')
    },
  }, defaultEditorState),

  [EditorTypes.COUNTER_JUSTIFICATION]: handleActions({
    [editors.addStatementAtom]: (state, action) => {
      const editEntity = {...state.editEntity}
      const atoms = clone(editEntity.basis.entity.atoms)
      const index = action.payload.index || atoms.length
      atoms.splice(index, 0, makeNewStatementAtom())
      editEntity.basis.entity.atoms = atoms
      return {...state, editEntity}
    },
    [editors.removeStatementAtom]: (state, action) => {
      const editEntity = {...state.editEntity}
      const atoms = clone(editEntity.basis.entity.atoms)
      atoms.splice(action.payload.index, 1)
      editEntity.basis.entity.atoms = atoms
      return {...state, editEntity}
    },
    [api.fetchStatementJustifications]: (state, action) => {
      const rootStatementId = state.editEntity && state.editEntity.rootStatementId
      if (rootStatementId && rootStatementId === action.payload.statementId) {
        return {...state, isFetching: true}
      }
      return state
    },
    [api.fetchStatementJustifications.response]: (state, action) => {
      const rootStatementId = state.editEntity && state.editEntity.rootStatementId
      if (rootStatementId && rootStatementId === action.payload.statementId) {
        return {...state, isFetching: false}
      }
      return state
    },
    [editors.commitEdit.result]: {
      throw: editorErrorReducer('justification')
    }
  }, defaultEditorState),

  [EditorTypes.NEW_JUSTIFICATION]: handleActions({
    [editors.addUrl]: (state, action) => {
      const editEntity = {...state.editEntity}
      editEntity.basis.citationReference.urls = editEntity.basis.citationReference.urls.concat([makeNewUrl()])
      return {...state, editEntity}
    },
    [editors.removeUrl]: (state, action) => {
      const editEntity = {...state.editEntity}
      const urls = clone(editEntity.basis.citationReference.urls)
      urls.splice(action.payload.index, 1)
      editEntity.basis.citationReference.urls = urls
      return {...state, editEntity}
    },
    [editors.addStatementAtom]: (state, action) => {
      const editEntity = {...state.editEntity}
      const atoms = clone(editEntity.basis.statementCompound.atoms)
      const index = action.payload.index || atoms.length
      atoms.splice(index, 0, makeNewStatementAtom())
      editEntity.basis.statementCompound.atoms = atoms
      return {...state, editEntity}
    },
    [editors.removeStatementAtom]: (state, action) => {
      const editEntity = {...state.editEntity}
      const atoms = clone(editEntity.basis.statementCompound.atoms)
      atoms.splice(action.payload.index, 1)
      editEntity.basis.statementCompound.atoms = atoms
      return {...state, editEntity}
    },
    [editors.commitEdit.result]: {
      throw: (state, action) => {
        const sourceError = action.payload.sourceError
        if (sourceError.errorType === customErrorTypes.API_RESPONSE_ERROR) {
          const responseBody = sourceError.body
          if (responseBody.errorCode === apiErrorCodes.VALIDATION_ERROR) {
            const errors = cloneDeep(responseBody.errors.justification)
            const name = justificationBasisTypeToNewJustificationBasisMemberName(action.meta.editEntity.basis.type)
            errors.fieldErrors.basis.fieldErrors[name] = errors.fieldErrors.basis.fieldErrors.entity
            delete errors.fieldErrors.basis.fieldErrors.entity
            return {...state, errors}
          }
        }
        return state
      }
    },
  }, defaultEditorState),

  [EditorTypes.STATEMENT_JUSTIFICATION]: handleActions({
    [editors.addUrl]: (state, action) => {
      const citationReference = {...state.editEntity.justification.basis.citationReference}
      citationReference.urls = citationReference.urls.concat([makeNewUrl()])
      return merge({...state}, {editEntity: {justification: {basis: {citationReference}}}})
    },
    [editors.removeUrl]: (state, action) => {
      const editEntity = {...state.editEntity}
      const urls = clone(editEntity.justification.basis.citationReference.urls)
      urls.splice(action.payload.index, 1)
      editEntity.justification.basis.citationReference.urls = urls
      return {...state, editEntity}
    },
    [editors.addStatementAtom]: (state, action) => {
      const editEntity = {...state.editEntity}
      const atoms = clone(editEntity.justification.basis.statementCompound.atoms)
      const index = action.payload.index || atoms.length
      atoms.splice(index, 0, makeNewStatementAtom())
      editEntity.justification.basis.statementCompound.atoms = atoms
      return {...state, editEntity}
    },
    [editors.removeStatementAtom]: (state, action) => {
      const editEntity = {...state.editEntity}
      const atoms = clone(editEntity.justification.basis.statementCompound.atoms)
      atoms.splice(action.payload.index, 1)
      editEntity.justification.basis.statementCompound.atoms = atoms
      return {...state, editEntity}
    },
  }, defaultEditorState),

  [EditorTypes.CITATION_REFERENCE]: handleActions({
    [editors.addUrl]: (state, action) => {
      const editEntity = {...state.editEntity}
      editEntity.urls = editEntity.urls.concat([makeNewUrl()])
      return {...state, editEntity}
    },
    [editors.removeUrl]: (state, action) => {
      const editEntity = {...state.editEntity}
      editEntity.urls.splice(action.payload.index, 1)
      return {...state, editEntity}
    },
    [api.fetchCitationReference]: (state, action) => {
      if (state.entityId === action.payload.citationReferenceId) {
        return {...state, isFetching: true}
      }
      return state
    },
    [api.fetchCitationReference.response]: (state, action) => {
      if (state.entityId === action.meta.requestPayload.citationReferenceId) {
        return {...state, isFetching: false}
      }
      return state
    },
    [editors.commitEdit.result]: {
      throw: editorErrorReducer('citationReference')
    },
  }, defaultEditorState),

  [EditorTypes.LOGIN_CREDENTIALS]: handleActions({
    [editors.commitEdit.result]: {
      throw: (state, action) => {
        const sourceError = action.payload.sourceError
        if (sourceError.errorType === customErrorTypes.API_RESPONSE_ERROR) {
          switch (sourceError.body.errorCode) {
            case (apiErrorCodes.INVALID_LOGIN_CREDENTIALS): {
              return {...state, errors: {credentials: {modelErrors: [INVALID_LOGIN_CREDENTIALS]}}, isSaving: false}
            }
            case (apiErrorCodes.VALIDATION_ERROR): {
              const errors = sourceError.body.errors.credentials
              return {...state, errors, isSaving: false}
            }
            default:
              return {...state, errors: {credentials: {modelErrors: [UNABLE_TO_LOGIN]}}, isSaving: false}
          }
        }

        return {...state, isSaving: false}
      }
    }
  }, defaultEditorState),
}

const defaultEditorReducer = editorReducerByType[EditorTypes.DEFAULT]

const handleEditorAction = (state, action) => {
  const {
    editorType,
    editorId,
  } = action.payload

  if (!editorType) {
    throw newProgrammingError('editorType is required')
  }
  if (!editorId) {
    throw newProgrammingError('editorId is required')
  }

  // editorState could be undefined
  const editorState = get(state, [editorType, editorId], defaultEditorState)
  const editorReducer = editorReducerByType[editorType]
  let newEditorState = editorReducer ? editorReducer(editorState, action) : editorState
  if (newEditorState === editorState) {
    // If the type-specific editor reducer didn't update the state, give the default reducer a crack at it
    // Basically we would like to be able to define default behavior for the editor actions in one place
    // If a type-specific editor reducer wants to override this behavior to do nothing, it can do
    // [actionType]: (state) => ({...state})
    newEditorState = defaultEditorReducer(editorState, action)
  }
  return editorState === newEditorState ?
      state :
      assign({}, state, {[editorType]: assign({}, state[editorType], {[editorId]: newEditorState} )})
}

const handleNonEditorAction = (state, action) => {
  let stateHasChanged = false
  const nextState = {}
  forEach(state, (editorTypeStates, editorType) => {
    // The same editor applies to all states within its key
    const editorReducer = editorReducerByType[editorType]
    let editorTypeStateHasChanged = false
    const nextEditorTypeStates = {}
    forEach(editorTypeStates, (editorState, editorId) => {
      let nextEditorState = editorReducer ? editorReducer(editorState, action) : editorState
      // Don't check the defaultEditorReducer for non-editor actions
      const editorStateHasChanged = nextEditorState !== editorState
      editorTypeStateHasChanged = editorTypeStateHasChanged || editorStateHasChanged
      nextEditorTypeStates[editorId] = editorStateHasChanged ? nextEditorState : editorState
    })
    stateHasChanged = stateHasChanged || editorTypeStateHasChanged
    nextState[editorType] = editorTypeStateHasChanged ? nextEditorTypeStates : editorTypeStates
  })

  return stateHasChanged ? nextState : state
}

export default (state = {}, action) => {
  const isEditorAction = has(EditorActions, action.type)
  if (isEditorAction) {
    return handleEditorAction(state, action)
  } else {
    return handleNonEditorAction(state, action)
  }
}
