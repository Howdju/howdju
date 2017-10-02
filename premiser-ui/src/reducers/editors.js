import assign from 'lodash/assign'
import clone from 'lodash/clone'
import cloneDeep from 'lodash/cloneDeep'
import forEach from 'lodash/forEach'
import get from 'lodash/get'
import has from 'lodash/has'
import isNumber from 'lodash/isNumber'
import includes from 'lodash/includes'
import merge from 'lodash/merge'
import reduce from 'lodash/reduce'
import set from 'lodash/set'
import { handleActions } from 'redux-actions'

import {
  apiErrorCodes,
  arrayToObject,
  makeNewStatementAtom,
  makeNewJustificationBasisCompoundAtom,
  makeNewUrl,
  newProgrammingError,
  idEqual,
  insertAt,
  removeAt,
} from "howdju-common"

import {
  api,
  editors
} from "../actions"
import {justificationBasisTypeToNewJustificationBasisMemberName} from '../viewModels'
import {uiErrorTypes} from "../uiErrors"
import {INVALID_LOGIN_CREDENTIALS, UNABLE_TO_LOGIN, USER_IS_INACTIVE_ERROR} from "../texts"

const EditorActions = reduce(editors, (editorActions, actionCreator) => {
  editorActions[actionCreator] = true
  // Include the result action too, if present
  if (actionCreator.result) {
    editorActions[actionCreator.result] = true
  }
  return editorActions
}, {})

export const EditorTypes = arrayToObject([
  'DEFAULT',
  'STATEMENT',
  'STATEMENT_COMPOUND',
  'JUSTIFICATION_BASIS_COMPOUND',
  'WRIT_QUOTE',
  'COUNTER_JUSTIFICATION',
  /* e.g. new justification dialog */
  'NEW_JUSTIFICATION',
  /* e.g. Statement justification page */
  'STATEMENT_JUSTIFICATION',
  'LOGIN_CREDENTIALS',
])

const defaultEditorState = {
  errors: null,
  isSaving: false,
}

const editorErrorReducer = errorKey => (state, action) => {
  const sourceError = action.payload.sourceError
  if (sourceError.errorType === uiErrorTypes.API_RESPONSE_ERROR) {
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

const makeAddAtomReducer = (atomsPath, atomMaker) => (state, action) => {
  const editEntity = {...state.editEntity}
  const atoms = clone(get(editEntity, atomsPath))
  const index = isNumber(action.payload.index) ? action.payload.index : atoms.length
  insertAt(atoms, index, atomMaker())
  set(editEntity, atomsPath, atoms)
  return {...state, editEntity}
}

const makeRemoveAtomReducer = (atomsPath) => (state, action) => {
  const editEntity = {...state.editEntity}
  const atoms = clone(get(editEntity, atomsPath))
  removeAt(atoms, action.payload.index)
  set(editEntity, atomsPath, atoms)
  return {...state, editEntity}
}

const makeAddUrlReducer = (urlsPathMaker) => (state, action) => {
  const {urlIndex} = action.payload
  const editEntity = {...state.editEntity}

  const urlsPath = urlsPathMaker(action.payload)
  const urls = clone(get(editEntity, urlsPath))
  const insertIndex = isNumber(urlIndex) ? urlIndex : urls.length
  insertAt(urls, insertIndex, makeNewUrl())
  set(editEntity, urlsPath, urls)
  return {...state, editEntity}
}

const makeRemoveUrlReducer = (urlsPathMaker) => (state, action) => {
  const {urlIndex} = action.payload
  const editEntity = {...state.editEntity}

  const urlsPath = urlsPathMaker(action.payload)
  const urls = clone(get(editEntity, urlsPath))
  removeAt(urls, urlIndex)
  set(editEntity, urlsPath, urls)
  return {...state, editEntity}
}

/** Reducers that separate the behavior from the state so that it is possible to have independent states updating according
 * to the same rules.  The editor type determines the rules that update the state, the editor type and editor ID identify
 * the state.
 */
const editorReducerByType = {

  [EditorTypes.DEFAULT]: handleActions({
    [editors.beginEdit]: (state, action) => {
      const {entity} = action.payload
      const editEntity = cloneDeep(entity)
      return {...state, editEntity, errors: null}
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
        if (sourceError.errorType === uiErrorTypes.API_RESPONSE_ERROR) {
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
      const statementId = get(state, 'editEntity.id')
      if (statementId === action.payload.statementId) {
        return {...state, isFetching: true}
      }
      return state
    },
    [api.fetchStatement]: (state, action) => {
      const statementId = get(state, 'editEntity.id')
      if (statementId === action.payload.statementId) {
        return {...state, isFetching: true}
      }
      return state
    },
    [api.fetchStatementJustifications.response]: (state, action) => {
      const statementId = get(state, 'editEntity.id')
      if (statementId === action.meta.requestPayload.statementId) {
        return {...state, isFetching: false}
      }
      return state
    },
    [api.fetchStatement.response]: (state, action) => {
      const statementId = get(state, 'editEntity.id')
      if (statementId === action.meta.requestPayload.statementId) {
        return {...state, isFetching: false}
      }
      return state
    },
    [editors.commitEdit.result]: {
      throw: editorErrorReducer('statement')
    },
  }, defaultEditorState),

  [EditorTypes.COUNTER_JUSTIFICATION]: handleActions({
    [editors.addJustificationBasisCompoundAtom]: makeAddAtomReducer('basis.justificationBasisCompound.atoms', makeNewJustificationBasisCompoundAtom),
    [editors.removeJustificationBasisCompoundAtom]: makeRemoveAtomReducer('basis.justificationBasisCompound.atoms'),
    [editors.addJustificationBasisCompoundAtomSourceExcerptParaphraseWritQuoteUrl]:
      makeAddUrlReducer( ({atomIndex}) => [
        'basis',
        'justificationBasisCompound',
        'atoms',
        atomIndex,
        'sourceExcerptParaphrase',
        'sourceExcerpt',
        'writQuote',
        'urls',
      ]),
    [editors.removeJustificationBasisCompoundAtomSourceExcerptParaphraseWritQuoteUrl]:
      makeRemoveUrlReducer( ({atomIndex}) => [
        'basis',
        'justificationBasisCompound',
        'atoms',
        atomIndex,
        'sourceExcerptParaphrase',
        'sourceExcerpt',
        'writQuote',
        'urls',
      ]),
    [api.fetchStatementJustifications]: (state, action) => {
      const rootStatementId = get(state.editEntity, 'rootStatement.id')
      if (idEqual(rootStatementId, action.payload.statementId)) {
        return {...state, isFetching: true}
      }
      return state
    },
    [api.fetchStatementJustifications.response]: (state, action) => {
      const rootStatementId = state.editEntity && state.editEntity.rootStatement.id
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
      editEntity.basis.writQuote.urls = editEntity.basis.writQuote.urls.concat([makeNewUrl()])
      return {...state, editEntity}
    },
    [editors.removeUrl]: (state, action) => {
      const editEntity = {...state.editEntity}
      const urls = clone(editEntity.basis.writQuote.urls)
      removeAt(urls, action.payload.index)
      editEntity.basis.writQuote.urls = urls
      return {...state, editEntity}
    },
    [editors.addStatementCompoundAtom]: makeAddAtomReducer('basis.statementCompound.atoms', makeNewStatementAtom),
    [editors.removeStatementCompoundAtom]: makeRemoveAtomReducer('basis.statementCompound.atoms'),
    [editors.addJustificationBasisCompoundAtom]: makeAddAtomReducer('basis.justificationBasisCompound.atoms', makeNewJustificationBasisCompoundAtom),
    [editors.removeJustificationBasisCompoundAtom]: makeRemoveAtomReducer('basis.justificationBasisCompound.atoms'),
    [editors.addJustificationBasisCompoundAtomSourceExcerptParaphraseWritQuoteUrl]:
      makeAddUrlReducer( ({atomIndex}) => [
        'basis',
        'justificationBasisCompound',
        'atoms',
        atomIndex,
        'sourceExcerptParaphrase',
        'sourceExcerpt',
        'writQuote',
        'urls',
      ]),
    [editors.removeJustificationBasisCompoundAtomSourceExcerptParaphraseWritQuoteUrl]:
      makeRemoveUrlReducer( ({atomIndex}) => [
        'basis',
        'justificationBasisCompound',
        'atoms',
        atomIndex,
        'sourceExcerptParaphrase',
        'sourceExcerpt',
        'writQuote',
        'urls',
      ]),
    [editors.commitEdit.result]: {
      throw: (state, action) => {
        const sourceError = action.payload.sourceError
        if (sourceError.errorType === uiErrorTypes.API_RESPONSE_ERROR) {
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
      const writQuote = {...state.editEntity.newJustification.basis.writQuote}
      writQuote.urls = writQuote.urls.concat([makeNewUrl()])
      return merge({...state}, {editEntity: {newJustification: {basis: {writQuote}}}})
    },
    [editors.removeUrl]: (state, action) => {
      const editEntity = {...state.editEntity}
      const urls = clone(editEntity.newJustification.basis.writQuote.urls)
      removeAt(urls, action.payload.index)
      editEntity.newJustification.basis.writQuote.urls = urls
      return {...state, editEntity}
    },
    [editors.addStatementCompoundAtom]: makeAddAtomReducer('newJustification.basis.statementCompound.atoms', makeNewStatementAtom),
    [editors.removeStatementCompoundAtom]: makeRemoveAtomReducer('newJustification.basis.statementCompound.atoms'),
    [editors.addJustificationBasisCompoundAtom]: makeAddAtomReducer(
      'newJustification.basis.justificationBasisCompound.atoms', makeNewJustificationBasisCompoundAtom),
    [editors.removeJustificationBasisCompoundAtom]:
      makeRemoveAtomReducer('newJustification.basis.justificationBasisCompound.atoms'),
    [editors.addJustificationBasisCompoundAtomSourceExcerptParaphraseWritQuoteUrl]:
      makeAddUrlReducer(({atomIndex}) => [
        'newJustification',
        'basis',
        'justificationBasisCompound',
        'atoms',
        atomIndex,
        'sourceExcerptParaphrase',
        'sourceExcerpt',
        'writQuote',
        'urls',
      ]),
    [editors.removeJustificationBasisCompoundAtomSourceExcerptParaphraseWritQuoteUrl]:
      makeRemoveUrlReducer(({atomIndex}) => [
        'newJustification',
        'basis',
        'justificationBasisCompound',
        'atoms',
        atomIndex,
        'sourceExcerptParaphrase',
        'sourceExcerpt',
        'writQuote',
        'urls',
      ]),
  }, defaultEditorState),

  [EditorTypes.WRIT_QUOTE]: handleActions({
    [editors.addUrl]: (state, action) => {
      const editEntity = {...state.editEntity}
      editEntity.urls = editEntity.urls.concat([makeNewUrl()])
      return {...state, editEntity}
    },
    [editors.removeUrl]: (state, action) => {
      const editEntity = {...state.editEntity}
      removeAt(editEntity.urls, action.payload.index)
      return {...state, editEntity}
    },
    [api.fetchWritQuote]: (state, action) => {
      const writQuoteId = get(state, 'editEntity.id')
      if (writQuoteId === action.payload.writQuoteId) {
        return {...state, isFetching: true}
      }
      return state
    },
    [api.fetchWritQuote.response]: (state, action) => {
      const writQuoteId = get(state, 'editEntity.id')
      if (writQuoteId === action.meta.requestPayload.writQuoteId) {
        return {...state, isFetching: false}
      }
      return state
    },
    [editors.commitEdit.result]: {
      throw: editorErrorReducer('writQuote')
    },
  }, defaultEditorState),

  [EditorTypes.LOGIN_CREDENTIALS]: handleActions({
    [editors.commitEdit.result]: {
      throw: (state, action) => {
        const sourceError = action.payload.sourceError
        if (sourceError.errorType === uiErrorTypes.API_RESPONSE_ERROR) {
          switch (sourceError.body.errorCode) {
            case (apiErrorCodes.INVALID_LOGIN_CREDENTIALS): {
              return {...state, errors: {credentials: {modelErrors: [INVALID_LOGIN_CREDENTIALS]}}, isSaving: false}
            }
            case (apiErrorCodes.USER_IS_INACTIVE_ERROR): {
              return {...state, errors: {credentials: {modelErrors: [USER_IS_INACTIVE_ERROR]}}, isSaving: false}
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
