import {
  put,
  call,
  takeEvery,
} from 'redux-saga/effects'
import {denormalize} from "normalizr"

import {
  JustificationBasisType,
  makeNewStatementCompoundFromStatement,
  makeNewJustificationBasisCompoundFromSourceExcerptParaphrase,
  makeNewStatementJustification,
  removeStatementCompoundId,
  JustificationBasisSourceType,
  newImpossibleError,
  JustificationBasisCompoundAtomType,
  SourceExcerptType,
} from 'howdju-common'

import {
  api,
  editors,
  flows,
  str,
} from "../../actions"

import {
  callApiForResource,
} from '../resourceApiSagas'

const fetchActionCreatorForBasisType = basisType => {
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

const extractBasisSourceFromFetchResponseAction = (basisType, fetchResponseAction) => {
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

  const basisSourceGetter = basisSourceGetterByBasisType[basisType]
  if (!basisSourceGetter) {
    throw newExhaustedEnumError(JustificationBasisSourceType, basisType)
  }
  const basisSource = basisSourceGetter(denormalize(result, schema, entities))

  return basisSource
}

export function* fetchAndBeginEditOfNewJustificationFromBasisSource() {

  yield takeEvery(str(flows.fetchAndBeginEditOfNewJustificationFromBasisSource), function* fetchAndBeginEditOfNewJustificationFromBasisSourceWorker(action) {
    const {
      editorId,
      editorType,
      basisSourceType,
      basisId,
    } = action.payload
    const actionCreator = fetchActionCreatorForBasisType(basisSourceType)
    const fetchResponseAction = yield call(callApiForResource, actionCreator(basisId))
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
          basis.statementCompound = basisSource
          removeStatementCompoundId(basis.statementCompound)
          break
        case JustificationBasisSourceType.STATEMENT:
          basis.type = JustificationBasisType.STATEMENT_COMPOUND
          basis.statementCompound = makeNewStatementCompoundFromStatement(basisSource)
          break
        case JustificationBasisSourceType.WRIT_QUOTE:
          basis.writQuote = basisSource
          break
        case JustificationBasisSourceType.JUSTIFICATION_BASIS_COMPOUND:
          basis.justificationBasisCompound = basisSource
          break
        case JustificationBasisSourceType.SOURCE_EXCERPT_PARAPHRASE:
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