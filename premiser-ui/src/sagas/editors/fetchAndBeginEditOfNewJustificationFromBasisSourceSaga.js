import {
  put,
  call,
  takeEvery,
} from 'redux-saga/effects'

import {
  JustificationBasisType,
  makeNewJustificationBasisCompoundFromWritQuote,
  makeNewJustificationBasisCompoundFromSourceExcerptParaphrase,
  makeNewJustificationBasisCompoundFromPropositionCompound,
  makeNewJustificationBasisCompoundFromProposition,
  makeNewPropositionJustification,
  JustificationBasisSourceType,
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
        case JustificationBasisSourceType.PROPOSITION_COMPOUND:
          removePropositionCompoundIds(basisSource)
          basis.type = JustificationBasisType.PROPOSITION_COMPOUND
          basis.propositionCompound = basisSource

          // basis.type = JustificationBasisType.JUSTIFICATION_BASIS_COMPOUND
          basis.justificationBasisCompound = makeNewJustificationBasisCompoundFromPropositionCompound(basisSource)
          break
        case JustificationBasisSourceType.PROPOSITION:
          removePropositionIds(basisSource)
          basis.type = JustificationBasisType.PROPOSITION_COMPOUND
          basis.propositionCompound = makeNewPropositionCompoundFromProposition(basisSource)

          // basis.type = JustificationBasisType.JUSTIFICATION_BASIS_COMPOUND
          basis.justificationBasisCompound = makeNewJustificationBasisCompoundFromProposition(basisSource)
          break
        case JustificationBasisSourceType.WRIT_QUOTE:
          removeWritQuoteIds(basisSource)
          basis.type = JustificationBasisType.WRIT_QUOTE
          basis.writQuote = basisSource

          // basis.type = JustificationBasisType.JUSTIFICATION_BASIS_COMPOUND
          basis.justificationBasisCompound = makeNewJustificationBasisCompoundFromWritQuote(basisSource)
          break
        case JustificationBasisSourceType.JUSTIFICATION_BASIS_COMPOUND:
          removeJustificationBasisCompoundIds(basisSource)
          basis.justificationBasisCompound = basisSource
          break
        case JustificationBasisSourceType.SOURCE_EXCERPT_PARAPHRASE:
          removeSourceExcerptParaphraseIds(basisSource)
          basis.type = JustificationBasisType.JUSTIFICATION_BASIS_COMPOUND
          basis.justificationBasisCompound = makeNewJustificationBasisCompoundFromSourceExcerptParaphrase(basisSource)
          break
        default:
          throw newExhaustedEnumError('JustificationBasisSourceType', basisSourceType)
      }

      const editModel = makeNewPropositionJustification({}, {basis})
      yield put(editors.beginEdit(editorType, editorId, editModel))
    }
  })
}

function fetchActionCreatorForBasisSourceType (basisType) {
  const actionCreatorByBasisType = {
    [JustificationBasisSourceType.PROPOSITION_COMPOUND]: api.fetchPropositionCompound,
    [JustificationBasisSourceType.WRIT_QUOTE]: api.fetchWritQuote,
    [JustificationBasisSourceType.PROPOSITION]: api.fetchProposition,
    [JustificationBasisSourceType.JUSTIFICATION_BASIS_COMPOUND]: api.fetchJustificationBasisCompound,
    [JustificationBasisSourceType.SOURCE_EXCERPT_PARAPHRASE]: api.fetchSourceExcerptParaphrase,
  }
  const actionCreator = actionCreatorByBasisType[basisType]
  if (!actionCreator) {
    throw newExhaustedEnumError('JustificationBasisSourceType', basisType)
  }
  return actionCreator
}

function extractBasisSourceFromFetchResponseAction (basisSourceType, fetchResponseAction) {
  const basisSourceGetterByBasisType = {
    [JustificationBasisSourceType.PROPOSITION_COMPOUND]: (result) => result.propositionCompound,
    [JustificationBasisSourceType.WRIT_QUOTE]: (result) => result.writQuote,
    [JustificationBasisSourceType.PROPOSITION]: (result) => result.proposition,
    [JustificationBasisSourceType.JUSTIFICATION_BASIS_COMPOUND]: (result) => result.justificationBasisCompound,
    [JustificationBasisSourceType.SOURCE_EXCERPT_PARAPHRASE]: (result) => result.sourceExcerptParaphrase,
  }
  const basisSourceGetter = basisSourceGetterByBasisType[basisSourceType]
  if (!basisSourceGetter) {
    throw newExhaustedEnumError(JustificationBasisSourceType, basisSourceType)
  }

  const basisSource = basisSourceGetter(fetchResponseAction.payload)

  return basisSource
}
