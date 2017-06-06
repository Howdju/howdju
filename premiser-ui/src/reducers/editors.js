import has from 'lodash/has'
import forEach from 'lodash/forEach'
import cloneDeep from 'lodash/cloneDeep'
import set from 'lodash/set'
import assign from 'lodash/assign'
import get from 'lodash/get'
import mapKeys from 'lodash/mapKeys'
import { handleActions } from 'redux-actions'

import {
  api,
  editors, str
} from "../actions"
import {makeNewUrl} from "../models";

const EditorActions = mapKeys(editors, str)

export const EditorTypes = {
  DEFAULT: 'DEFAULT',
  STATEMENT: 'STATEMENT',
  JUSTIFICATION: 'JUSTIFICATION',
  CITATION_REFERENCE: 'CITATION_REFERENCE',
  STATEMENT_JUSTIFICATION: 'STATEMENT_JUSTIFICATION',
  LOGIN_CREDENTIALS: 'LOGIN_CREDENTIALS',
}

/** Reducers that separate the behavior from the state so that it is possible to have independent states updating according
 * to the same rules.  The editor type determines the rules that update the state, the editor type and editor ID identify
 * the state.
 */
const editorReducerByType = {
  [EditorTypes.DEFAULT]: handleActions({
    [editors.init]: (state, action) => {
      const {entityId} = action.payload
      return {...state, entityId}
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
      return {...state, editEntity}
    },
    [editors.commitEdit]: (state, action) => ({...state, errors: null}),
    [editors.commitEdit.result]: {
      next: (state, action) => ({...state, editEntity: null}),
      // errors: { entity: {[code]: {[args]: ...} }, ...], fields: { [field]: {[code]: {[args]: ...}} } }
      throw: (state, action) => ({...state, errors: action.payload.errors})
    },
    [editors.cancelEdit]: (state, action) => ({...state, editEntity: null}),
  }, {}),
  [EditorTypes.STATEMENT]: handleActions({
    [api.fetchStatementJustifications]: (state, action) => {
      if (state.entityId === action.payload.statementId) {
        return {...state, isFetching: true}
      }
      return state
    },
    [api.fetchStatementJustifications.response]: (state, action) => {
      if (state.entityId === action.payload.result.statement) {
        return {...state, isFetching: false}
      }
      return state
    },
    [api.updateStatement]: (state, action) => {
      if (state.entityId === action.payload.statement.id) {
        return {...state, isUpdating: true}
      }
      return state
    },
    [api.updateStatement.response]: (state, action) => {
      if (state.entityId === action.payload.result.statement) {
        return {...state, isUpdating: false}
      }
      return state
    }
  }, {}),
  [EditorTypes.JUSTIFICATION]: handleActions({
    [editors.editJustificationAddUrl]: (state, action) => {
      const editEntity = {...state.editEntity}
      editEntity.basis.citationReference.urls = editEntity.basis.citationReference.urls.concat([makeNewUrl()])
      return {...state, editEntity}
    },
    [editors.editJustificationAddUrl]: (state, action) => {
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
    [api.updateCitationReference]: (state, action) => {
      if (state.entityId === action.payload.citationReference.id) {
        return {...state, isUpdating: true}
      }
      return state
    },
    [api.updateCitationReference.response]: (state, action) => {
      if (state.entityId === action.payload.result.citationReference) {
        return {...state, isUpdating: false}
      }
      return state
    }
  }, {}),
  [EditorTypes.CITATION_REFERENCE]: handleActions({
    [editors.editJustificationAddUrl]: (state, action) => {
      const editEntity = {...state.editEntity}
      editEntity.urls = editEntity.urls.concat([makeNewUrl()])
      return {...state, editEntity}
    },
    [editors.editJustificationAddUrl]: (state, action) => {
      const editEntity = {...state.editEntity}
      editEntity.urls.splice(action.payload.index, 1)
      return {...state, editEntity}
    },
    // TODO how to see that citationReference is being fetched with API?  Usually done via requesting justification,
    // which citationReference doesn't know about directly and doesn't even have a one-to-one correspondence with
    [api.updateCitationReference]: (state, action) => {
      if (state.entityId === action.payload.citationReference.id) {
        return {...state, isUpdating: true}
      }
      return state
    },
    [api.updateCitationReference.response]: (state, action) => {
      if (state.entityId === action.payload.result.citationReference) {
        return {...state, isUpdating: false}
      }
      return state
    }
  }, {})
}

const defaultEditorReducer = editorReducerByType[EditorTypes.DEFAULT]

const handleEditorAction = (state, action) => {
  const {
    editorType,
    editorId,
  } = action.payload

  // editorState could be undefined
  const editorState = get(state, [editorType, editorId])
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
