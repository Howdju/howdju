import {
  put,
  call,
  takeEvery,
} from 'redux-saga/effects'
import {denormalize} from "normalizr"

import {
  JustificationBasisType,
  makeNewStatementCompoundForStatement,
  makeNewStatementJustification,
  removeStatementCompoundId,
  JustificationBasisSourceType,
  newImpossibleError,
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
  }
  const actionCreator = actionCreatorByBasisType[basisType]
  if (!actionCreator) {
    throw newImpossibleError(`${basisType} exhausted justification basis types`)
  }
  return actionCreator
}

const extractBasisFromFetchResponseAction = (basisType, fetchResponseAction) => {
  const {
    result,
    entities
  } = fetchResponseAction.payload
  const {
    schema,
  } = fetchResponseAction.meta

  const basisGetterByBasisType = {
    [JustificationBasisSourceType.STATEMENT_COMPOUND]: result => result.statementCompound,
    [JustificationBasisSourceType.WRIT_QUOTE]: result => result.writQuote,
    [JustificationBasisSourceType.STATEMENT]: result => result.statement,
    [JustificationBasisSourceType.JUSTIFICATION_BASIS_COMPOUND]: result => result.justificationBasisCompound,
  }

  const basisGetter = basisGetterByBasisType[basisType]
  if (!basisGetter) {
    throw newImpossibleError(`${basisType} exhausted justification basis types`)
  }
  const basis = basisGetter(denormalize(result, schema, entities))

  return basis
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
      const basis = extractBasisFromFetchResponseAction(basisSourceType, fetchResponseAction)

      let basisType = basisSourceType

      let statementCompound = undefined
      if (basisSourceType === JustificationBasisType.STATEMENT_COMPOUND) {
        statementCompound = basis
        removeStatementCompoundId(statementCompound)
      } else if (basisSourceType === JustificationBasisSourceType.STATEMENT) {
        basisType = JustificationBasisType.STATEMENT_COMPOUND
        statementCompound = makeNewStatementCompoundForStatement(basis)
      }

      let writQuote = undefined
      if (basisType === JustificationBasisType.WRIT_QUOTE) {
        writQuote = basis
      }

      let justificationBasisCompound = undefined
      if (basisType === JustificationBasisType.JUSTIFICATION_BASIS_COMPOUND) {
        justificationBasisCompound = basis
      }

      const editModel = makeNewStatementJustification({}, {
        basis: {
          type: basisType,
          statementCompound,
          writQuote,
          justificationBasisCompound,
        }
      })
      yield put(editors.beginEdit(editorType, editorId, editModel))
    }
  })
}
