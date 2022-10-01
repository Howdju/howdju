import assign from 'lodash/assign'
import clone from 'lodash/clone'
import cloneDeep from 'lodash/cloneDeep'
import concat from 'lodash/concat'
import difference from 'lodash/difference'
import find from 'lodash/find'
import forEach from 'lodash/forEach'
import get from 'lodash/get'
import has from 'lodash/has'
import isNumber from 'lodash/isNumber'
import isString from 'lodash/isString'
import includes from 'lodash/includes'
import merge from 'lodash/merge'
import reduce from 'lodash/reduce'
import set from 'lodash/set'
import { handleActions } from 'redux-actions'

import {
  apiErrorCodes,
  arrayToObject,
  insertAt,
  JustificationRootTargetType,
  makeNewPropositionAtom,
  makeNewJustificationBasisCompoundAtom,
  makeNewPersorg,
  makeNewUrl,
  newProgrammingError,
  removeAt,
  makePropositionTagVote,
  PropositionTagVotePolarity,
  tagEqual,
} from "howdju-common"

import {
  api,
  editors
} from "../actions"
import {uiErrorTypes} from "../uiErrors"
import {INVALID_LOGIN_CREDENTIALS, UNABLE_TO_LOGIN, USER_IS_INACTIVE_ERROR} from "../texts"
import {logger} from '../logger'


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
  PROPOSITION: 'PROPOSITION',
  PROPOSITION_COMPOUND: 'PROPOSITION_COMPOUND',
  JUSTIFICATION_BASIS_COMPOUND: 'JUSTIFICATION_BASIS_COMPOUND',
  WRIT_QUOTE: 'WRIT_QUOTE',
  COUNTER_JUSTIFICATION: 'COUNTER_JUSTIFICATION',
  /* e.g. new justification dialog */
  NEW_JUSTIFICATION: 'NEW_JUSTIFICATION',
  /* e.g. Proposition justification page */
  PROPOSITION_JUSTIFICATION: 'PROPOSITION_JUSTIFICATION',
  LOGIN_CREDENTIALS: 'LOGIN_CREDENTIALS',
  REGISTRATION_REQUEST: 'REGISTRATION_REQUEST',
  REGISTRATION_CONFIRMATION: 'REGISTRATION_CONFIRMATION',
  PERSORG: 'PERSORG',
  ACCOUNT_SETTINGS: 'ACCOUNT_SETTINGS',
  CONTENT_REPORT: 'CONTENT_REPORT',
}

const defaultEditorState = {
  editEntity: null,
  errors: null,
  isSaving: false,
  dirtyFields: {},
  wasSubmitAttempted: false,
}

const editorErrorReducer = (errorKey) => (state, action) => {
  const sourceError = action.payload.sourceError
  if (sourceError.errorType === uiErrorTypes.API_RESPONSE_ERROR) {
    const responseBody = sourceError.body
    if (responseBody && includes([
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

// TODO(#83): replace bespoke list reducers with addListItem/removeListItem
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
const defaultEditorActions = {
  [editors.beginEdit]: (state, action) => {
    const {entity} = action.payload
    const editEntity = cloneDeep(entity)
    return {...state, editEntity, errors: null}
  },
  [editors.propertyChange]: (state, action) => {
    const editEntity = cloneDeep(state.editEntity)
    const properties = action.payload.properties
    const newDirtyFields = {}
    forEach(properties, (val, key) => {
      set(editEntity, key, val)
      newDirtyFields[key] = true
    })
    const dirtyFields = {...state.dirtyFields, ...newDirtyFields}
    return {...state, editEntity, dirtyFields}
  },
  [editors.addListItem]: (state, action) => {
    const {itemIndex, listPathMaker, itemFactory} = action.payload
    const editEntity = {...state.editEntity}

    const listPath = isString(listPathMaker) ? listPathMaker : listPathMaker(action.payload)
    const list = clone(get(editEntity, listPath))
    const insertIndex = isNumber(itemIndex) ? itemIndex : list.length
    insertAt(list, insertIndex, itemFactory())
    set(editEntity, listPath, list)
    return {...state, editEntity}
  },
  [editors.removeListItem]: (state, action) => {
    const {itemIndex, listPathMaker} = action.payload
    const editEntity = {...state.editEntity}

    const listPath = isString(listPathMaker) ? listPathMaker : listPathMaker(action.payload)
    const list = clone(get(editEntity, listPath))
    removeAt(list, itemIndex)
    set(editEntity, listPath, list)
    return {...state, editEntity}
  },
  [editors.commitEdit]: (state, action) => ({
    ...state,
    isSaving: true,
    errors: null,
    wasSubmitAttempted: true,
  }),
  [editors.commitEdit.result]: {
    next: (state, action) => ({
      ...state,
      isSaving: false,
      editEntity: null,
      dirtyFields: {},
    }),
    throw: (state, action) => {
      const sourceError = action.payload.sourceError
      if (sourceError.errorType === uiErrorTypes.API_RESPONSE_ERROR) {
        const responseBody = sourceError.body
        if (get(responseBody, 'errorCode') === apiErrorCodes.VALIDATION_ERROR) {
          return {...state, isSaving: false, errors: responseBody.errors}
        }
      }

      return {...state, isSaving: false}
    }
  },
  [editors.cancelEdit]: (state, action) => ({
    ...state,
    editEntity: null,
    dirtyFields: {},
  }),
}
const defaultEditorReducer = handleActions(defaultEditorActions, defaultEditorState)
const editorReducerByType = {

  [EditorTypes.DEFAULT]: defaultEditorReducer,

  [EditorTypes.PROPOSITION]: handleActions({
    [api.fetchRootJustificationTarget]: (state, action) => {
      const {
        rootTargetType,
        rootTargetId,
      } = action.payload
      const propositionId = get(state, 'editEntity.id')
      if (rootTargetType === JustificationRootTargetType.PROPOSITION && propositionId === rootTargetId) {
        return {...state, isFetching: true}
      }
      return state
    },
    [api.fetchProposition]: (state, action) => {
      const propositionId = get(state, 'editEntity.id')
      if (propositionId === action.payload.propositionId) {
        return {...state, isFetching: true}
      }
      return state
    },
    [api.fetchRootJustificationTarget.response]: (state, action) => {
      const {
        rootTargetType,
        rootTargetId,
      } = action.meta.requestPayload
      const propositionId = get(state, 'editEntity.id')
      if (rootTargetType === JustificationRootTargetType.PROPOSITION && propositionId === rootTargetId) {
        return {...state, isFetching: false}
      }
      return state
    },
    [api.fetchProposition.response]: (state, action) => {
      const propositionId = get(state, 'editEntity.id')
      if (propositionId === action.meta.requestPayload.propositionId) {
        return {...state, isFetching: false}
      }
      return state
    },
    [editors.commitEdit.result]: {
      throw: editorErrorReducer('proposition')
    },
  }, defaultEditorState),

  [EditorTypes.COUNTER_JUSTIFICATION]: handleActions({
    [editors.addPropositionCompoundAtom]: makeAddAtomReducer('basis.propositionCompound.atoms', makeNewPropositionAtom),
    [editors.removePropositionCompoundAtom]: makeRemoveAtomReducer('basis.propositionCompound.atoms'),
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
    [editors.addPropositionCompoundAtom]: makeAddAtomReducer('basis.propositionCompound.atoms', makeNewPropositionAtom),
    [editors.removePropositionCompoundAtom]: makeRemoveAtomReducer('basis.propositionCompound.atoms'),
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
      throw: editorErrorReducer('justification')
    },
  }, defaultEditorState),

  [EditorTypes.PROPOSITION_JUSTIFICATION]: handleActions({
    [editors.addSpeaker]: (state, action) => {
      const editEntity = state.editEntity
      const speakers = editEntity.speakers
      return assign({}, state, {
        editEntity: {
          ...editEntity,
          speakers: [makeNewPersorg(), ...speakers  ]
        }
      })
    },
    [editors.removeSpeaker]: (state, action) => {
      const editEntity = state.editEntity
      const speakers = clone(editEntity.speakers)
      removeAt(speakers, action.payload.index)
      return assign({}, state, {
        editEntity: {
          ...editEntity,
          speakers
        }
      })
    },
    [editors.replaceSpeaker]: (state, action) => {
      const editEntity = state.editEntity
      const speakers = clone(editEntity.speakers)
      speakers[action.payload.index] = action.payload.speaker
      return assign({}, state, {
        editEntity: {
          ...editEntity,
          speakers
        }
      })
    },
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
    [editors.addPropositionCompoundAtom]: makeAddAtomReducer('newJustification.basis.propositionCompound.atoms', makeNewPropositionAtom),
    [editors.removePropositionCompoundAtom]: makeRemoveAtomReducer('newJustification.basis.propositionCompound.atoms'),
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

    [editors.tagProposition]: makePropositionTagReducer(PropositionTagVotePolarity.POSITIVE, concat),
    [editors.unTagProposition]: makePropositionTagReducer(PropositionTagVotePolarity.POSITIVE, difference),
  }, defaultEditorState),

  [EditorTypes.WRIT_QUOTE]: handleActions({
    [editors.addUrl]: (state, action) => {
      const editEntity = {...state.editEntity}
      editEntity.urls = editEntity.urls.concat([makeNewUrl()])
      return {...state, editEntity}
    },
    [editors.removeUrl]: (state, action) => {
      const editEntity = {...state.editEntity}

      const urls = clone(editEntity.urls)
      removeAt(urls, action.payload.index)
      editEntity.urls = urls

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
          switch (get(sourceError, 'body.errorCode')) {
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

  [EditorTypes.REGISTRATION_REQUEST]: handleActions({
    [editors.commitEdit.result]: {
      next: (state, action) => ({
        ...state,
        duration: action.payload.result.duration,
        isSaving: false,
        isSubmitted: true
      }),
      throw: (state, action) => {
        state = editorErrorReducer('registration')(state, action)
        state.isSubmitted = false
        return state
      }
    },
    [editors.resetSubmission]: (state, action) => ({...state, isSubmitted: false}),
  }, defaultEditorState),

  [EditorTypes.REGISTRATION_CONFIRMATION]: handleActions({
    [editors.commitEdit.result]: {
      next: (state, action) => ({...state, isSaving: false, isConfirmed: true}),
      throw: (state, action) => {
        state = editorErrorReducer('registrationConfirmation')(state, action)
        state.isConfirmed = false
        return state
      }
    },
    [editors.resetSubmission]: (state, action) => ({...state, isSubmitted: false}),
  }, defaultEditorState),
}

function makePropositionTagReducer(polarity, combiner) {
  return (state, action) => {
    const proposition = state.editEntity.proposition
    const {tag} = action.payload

    const oldPropositionTagVotes = get(proposition, 'propositionTagVotes', [])
    const redundantPropositionTagVotes = [],
      contradictoryPropositionTagVotes = []
    forEach(oldPropositionTagVotes, vote => {
      if (vote.proposition.id === proposition.id && tagEqual(vote.tag, tag)) {
        if (vote.polarity === polarity) {
          redundantPropositionTagVotes.push(vote)
        } else {
          contradictoryPropositionTagVotes.push(vote)
        }
      }
    })

    const oldTags = get(proposition, 'tags', [])
    const existingTag = find(oldTags, oldTag => tagEqual(oldTag, tag))
    const tags = existingTag ?
      oldTags :
      combiner(oldTags, [tag])

    if (
      tags === oldTags &&
      redundantPropositionTagVotes.length > 0 && contradictoryPropositionTagVotes.length < 1
    ) {
      logger.debug(`Proposition is already tagged with ${tag}`)
      return state
    }

    const propositionTagVotes = redundantPropositionTagVotes.length > 0 ?
      oldPropositionTagVotes :
      combiner(
        oldPropositionTagVotes,
        [makePropositionTagVote({polarity, tag, proposition})]
      )

    return {...state, editEntity: {...state.editEntity, proposition: {...proposition, tags, propositionTagVotes}}}
  }
}

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
