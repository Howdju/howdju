import {
  put,
  call,
  takeEvery,
} from 'redux-saga/effects'

import {
  JustificationBasisTypes,
  makeNewJustificationBasisCompoundFromWritQuote,
  makeNewJustificationBasisCompoundFromSourceExcerptParaphrase,
  makeNewJustificationBasisCompoundFromPropositionCompound,
  makeNewJustificationBasisCompoundFromProposition,
  makeNewPropositionJustification,
  JustificationBasisSourceTypes,
  newExhaustedEnumError,
  makeNewPropositionCompoundFromProposition,
} from 'howdju-common'

import {
  api,
  editors,
  flows,
  str,
} from "../../actions"
import {
  removePropositionCompoundIds,
  removePropositionIds,
  removeSourceExcerptParaphraseIds,
  removeJustificationBasisCompoundIds,
  removeWritQuoteIds,
} from '../../viewModels'
import {
  callApiForResource,
} from '../resourceApiSagas'


export function* fetchAndBeginEditOfNewJustificationFromBasisSource() {

  yield takeEvery(str(flows.fetchAndBeginEditOfNewJustificationFromBasisSource), function* fetchAndBeginEditOfNewJustificationFromBasisSourceWorker(action) {
    const {
      editorId,
      editorType,
      basisSourceType,
      basisSourceId,
    } = action.payload

    const actionCreator = fetchActionCreatorForBasisSourceType(basisSourceType)
    const fetchResponseAction = yield call(callApiForResource, actionCreator(basisSourceId))
    if (!fetchResponseAction.error) {
      const basisSource = extractBasisSourceFromFetchResponseAction(basisSourceType, fetchResponseAction)

      const basis = {
        type: basisSourceType,
        propositionCompound: undefined,
        writQuote: undefined,
        justificationBasisCompound: undefined,
      }

      switch (basisSourceType) {
        case JustificationBasisSourceTypes.PROPOSITION_COMPOUND:
          removePropositionCompoundIds(basisSource)
          basis.type = JustificationBasisTypes.PROPOSITION_COMPOUND
          basis.propositionCompound = basisSource

          // basis.type = JustificationBasisTypes.JUSTIFICATION_BASIS_COMPOUND
          basis.justificationBasisCompound = makeNewJustificationBasisCompoundFromPropositionCompound(basisSource)
          break
        case JustificationBasisSourceTypes.PROPOSITION:
          removePropositionIds(basisSource)
          basis.type = JustificationBasisTypes.PROPOSITION_COMPOUND
          basis.propositionCompound = makeNewPropositionCompoundFromProposition(basisSource)

          // basis.type = JustificationBasisTypes.JUSTIFICATION_BASIS_COMPOUND
          basis.justificationBasisCompound = makeNewJustificationBasisCompoundFromProposition(basisSource)
          break
        case JustificationBasisSourceTypes.WRIT_QUOTE:
          removeWritQuoteIds(basisSource)
          basis.type = JustificationBasisTypes.WRIT_QUOTE
          basis.writQuote = basisSource

          // basis.type = JustificationBasisTypes.JUSTIFICATION_BASIS_COMPOUND
          basis.justificationBasisCompound = makeNewJustificationBasisCompoundFromWritQuote(basisSource)
          break
        case JustificationBasisSourceTypes.JUSTIFICATION_BASIS_COMPOUND:
          removeJustificationBasisCompoundIds(basisSource)
          basis.justificationBasisCompound = basisSource
          break
        case JustificationBasisSourceTypes.SOURCE_EXCERPT_PARAPHRASE:
          removeSourceExcerptParaphraseIds(basisSource)
          basis.type = JustificationBasisTypes.JUSTIFICATION_BASIS_COMPOUND
          basis.justificationBasisCompound = makeNewJustificationBasisCompoundFromSourceExcerptParaphrase(basisSource)
          break
        default:
          throw newExhaustedEnumError('JustificationBasisSourceTypes', basisSourceType)
      }

      const editModel = makeNewPropositionJustification({}, {basis})
      yield put(editors.beginEdit(editorType, editorId, editModel))
    }
  })
}

function fetchActionCreatorForBasisSourceType (basisType) {
  const actionCreatorByBasisType = {
    [JustificationBasisSourceTypes.PROPOSITION_COMPOUND]: api.fetchPropositionCompound,
    [JustificationBasisSourceTypes.WRIT_QUOTE]: api.fetchWritQuote,
    [JustificationBasisSourceTypes.PROPOSITION]: api.fetchProposition,
    [JustificationBasisSourceTypes.JUSTIFICATION_BASIS_COMPOUND]: api.fetchJustificationBasisCompound,
    [JustificationBasisSourceTypes.SOURCE_EXCERPT_PARAPHRASE]: api.fetchSourceExcerptParaphrase,
  }
  const actionCreator = actionCreatorByBasisType[basisType]
  if (!actionCreator) {
    throw newExhaustedEnumError('JustificationBasisSourceTypes', basisType)
  }
  return actionCreator
}

function extractBasisSourceFromFetchResponseAction (basisSourceType, fetchResponseAction) {
  const basisSourceGetterByBasisType = {
    [JustificationBasisSourceTypes.PROPOSITION_COMPOUND]: (result) => result.propositionCompound,
    [JustificationBasisSourceTypes.WRIT_QUOTE]: (result) => result.writQuote,
    [JustificationBasisSourceTypes.PROPOSITION]: (result) => result.proposition,
    [JustificationBasisSourceTypes.JUSTIFICATION_BASIS_COMPOUND]: (result) => result.justificationBasisCompound,
    [JustificationBasisSourceTypes.SOURCE_EXCERPT_PARAPHRASE]: (result) => result.sourceExcerptParaphrase,
  }
  const basisSourceGetter = basisSourceGetterByBasisType[basisSourceType]
  if (!basisSourceGetter) {
    throw newExhaustedEnumError(JustificationBasisSourceTypes, basisSourceType)
  }

  const basisSource = basisSourceGetter(fetchResponseAction.payload)

  return basisSource
}
