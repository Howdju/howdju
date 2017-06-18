import has from 'lodash/has'
import forEach from 'lodash/forEach'
import cloneDeep from 'lodash/cloneDeep'
import set from 'lodash/set'
import assign from 'lodash/assign'
import get from 'lodash/get'
import reduce from 'lodash/reduce'
import merge from 'lodash/merge'
import { handleActions } from 'redux-actions'

import {
  api,
  editors
} from "../actions"
import {makeNewUrl} from "../models";
import * as apiErrorCodes from "../apiErrorCodes";
import {customErrorTypes} from "../customErrors";

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
  CITATION_REFERENCE: 'CITATION_REFERENCE',
  JUSTIFICATION: 'JUSTIFICATION',
  NEW_JUSTIFICATION: 'NEW_JUSTIFICATION',
  STATEMENT_JUSTIFICATION: 'STATEMENT_JUSTIFICATION',
  LOGIN_CREDENTIALS: 'LOGIN_CREDENTIALS',
}

const defaultEditorState = {}

/** Reducers that separate the behavior from the state so that it is possible to have independent states updating according
 * to the same rules.  The editor type determines the rules that update the state, the editor type and editor ID identify
 * the state.
 */
const editorReducerByType = {

  [EditorTypes.DEFAULT]: handleActions({
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
    [editors.commitEdit]: (state, action) => ({...state, errors: null}),
    [editors.commitEdit.result]: {
      next: (state, action) => ({...state, editEntity: null}),
      throw: (state, action) => {
        const sourceError = action.payload.sourceError
        if (sourceError.errorType === customErrorTypes.API_RESPONSE_ERROR) {
          const responseBody = sourceError.body
          if (responseBody.errorCode === apiErrorCodes.VALIDATION_ERROR) {
            return {...state, errors: responseBody.errors}
          }
        }

        return state
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
    [api.fetchStatementJustifications.response]: {
      next: (state, action) => {
        if (state.entityId === action.payload.result.statementJustification.statement) {
          return {...state, isFetching: false}
        }
        return state
      },
      throw: (state, action) => {
        if (state.entityId === action.meta.requestPayload.statementJustification.statement.id) {
          return {...state, isFetching: false}
        }
        return state
      }
    },
    [api.updateStatement]: (state, action) => {
      if (state.entityId === action.payload.statement.id) {
        return {...state, isUpdating: true}
      }
      return state
    },
    [api.updateStatement.response]: {
      next: (state, action) => {
        if (state.entityId === action.payload.result.statement) {
          return {...state, isUpdating: false}
        }
        return state
      },
      throw: (state, action) => {
        if (state.entityId === action.meta.requestPayload.statement.id) {
          return {...state, isUpdating: false}
        }
        return state
      }
    }
  }, defaultEditorState),

  [EditorTypes.JUSTIFICATION]: handleActions({
    [editors.addUrl]: (state, action) => {
      const editEntity = {...state.editEntity}
      editEntity.basis.citationReference.urls = editEntity.basis.citationReference.urls.concat([makeNewUrl()])
      return {...state, editEntity}
    },
    [editors.deleteUrl]: (state, action) => {
      const editEntity = {...state.editEntity}
      editEntity.basis.citationReference.urls.splice(action.payload.index, 1)
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
  }, defaultEditorState),

  [EditorTypes.STATEMENT_JUSTIFICATION]: handleActions({
    [editors.addUrl]: (state, action) => {
      const citationReference = {...state.editEntity.justification.basis.citationReference}
      citationReference.urls = citationReference.urls.concat([makeNewUrl()])
      return merge({...state}, {editEntity: {justification: {basis: {citationReference}}}})
    },
    [editors.deleteUrl]: (state, action) => {
      const citationReference = {...state.editEntity.justification.basis.citationReference}
      citationReference.urls.splice(action.payload.index, 1)
      return merge({...state}, {editEntity: {justification: {basis: {citationReference}}}})
    },
  }, defaultEditorState),

  [EditorTypes.CITATION_REFERENCE]: handleActions({
    [editors.addUrl]: (state, action) => {
      const editEntity = {...state.editEntity}
      editEntity.urls = editEntity.urls.concat([makeNewUrl()])
      return {...state, editEntity}
    },
    [editors.deleteUrl]: (state, action) => {
      const editEntity = {...state.editEntity}
      editEntity.urls.splice(action.payload.index, 1)
      return {...state, editEntity}
    },
    [api.updateCitationReference]: (state, action) => {
      if (state.entityId === action.payload.citationReference.id) {
        return {...state, isUpdating: true}
      }
      return state
    },
    [api.updateCitationReference.response]: {
      next: (state, action) => {
        if (state.entityId === action.payload.result.citationReference) {
          return {...state, isUpdating: false}
        }
        return state
      },
      throw: (state, action) => {
        if (state.entityId === action.meta.requestPayload.citationReference.id) {
          return {...state, isUpdating: false}
        }
        return state
      }
    }
  }, defaultEditorState)
}

const defaultEditorReducer = editorReducerByType[EditorTypes.DEFAULT]

const handleEditorAction = (state, action) => {
  const {
    editorType,
    editorId,
  } = action.payload

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
