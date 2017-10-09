import {
  put,
  call,
  takeEvery,
} from 'redux-saga/effects'
import {denormalize} from "normalizr"

import {
  JustificationBasisType,
  makeNewJustificationBasisCompoundFromWritQuote,
  makeNewJustificationBasisCompoundFromSourceExcerptParaphrase,
  makeNewJustificationBasisCompoundFromStatementCompound,
  makeNewJustificationBasisCompoundFromStatement,
  makeNewStatementJustification,
  JustificationBasisSourceType,
  newExhaustedEnumError,
  makeNewStatementCompoundFromStatement,
} from 'howdju-common'

import {
  api,
  editors,
  flows,
  str,
} from "../../actions"
import {
  removeStatementCompoundIds,
  removeStatementIds,
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
        statementCompound: undefined,
        writQuote: undefined,
        justificationBasisCompound: undefined,
      }

      switch (basisSourceType) {
        case JustificationBasisSourceType.STATEMENT_COMPOUND:
          removeStatementCompoundIds(basisSource)
          basis.type = JustificationBasisType.STATEMENT_COMPOUND
          basis.statementCompound = basisSource

          // basis.type = JustificationBasisType.JUSTIFICATION_BASIS_COMPOUND
          basis.justificationBasisCompound = makeNewJustificationBasisCompoundFromStatementCompound(basisSource)
          break
        case JustificationBasisSourceType.STATEMENT:
          removeStatementIds(basisSource)
          basis.type = JustificationBasisType.STATEMENT_COMPOUND
          basis.statementCompound = makeNewStatementCompoundFromStatement(basisSource)

          // basis.type = JustificationBasisType.JUSTIFICATION_BASIS_COMPOUND
          basis.justificationBasisCompound = makeNewJustificationBasisCompoundFromStatement(basisSource)
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

      const editModel = makeNewStatementJustification({}, {basis})
      yield put(editors.beginEdit(editorType, editorId, editModel))
    }
  })
}

function fetchActionCreatorForBasisSourceType (basisType) {
  const actionCreatorByBasisType = {
    [JustificationBasisSourceType.STATEMENT_COMPOUND]: api.fetchStatementCompound,
    [JustificationBasisSourceType.WRIT_QUOTE]: api.fetchWritQuote,
    [JustificationBasisSourceType.STATEMENT]: api.fetchStatement,
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
  const {
    result,
    entities
  } = fetchResponseAction.payload
  const {
    schema,
  } = fetchResponseAction.meta


  const basisSourceGetterByBasisType = {
    [JustificationBasisSourceType.STATEMENT_COMPOUND]: (result) => result.statementCompound,
    [JustificationBasisSourceType.WRIT_QUOTE]: (result) => result.writQuote,
    [JustificationBasisSourceType.STATEMENT]: (result) => result.statement,
    [JustificationBasisSourceType.JUSTIFICATION_BASIS_COMPOUND]: (result) => result.justificationBasisCompound,
    [JustificationBasisSourceType.SOURCE_EXCERPT_PARAPHRASE]: (result) => result.sourceExcerptParaphrase,
  }
  const basisSourceGetter = basisSourceGetterByBasisType[basisSourceType]
  if (!basisSourceGetter) {
    throw newExhaustedEnumError(JustificationBasisSourceType, basisSourceType)
  }

  const basisSource = basisSourceGetter(denormalize(result, schema, entities))

  return basisSource
}
