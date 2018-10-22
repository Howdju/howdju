import {
  take,
  put,
  takeEvery,
} from 'redux-saga/effects'

import {
  JustificationTargetType,
  assert,
} from 'howdju-common'

import {EditorTypes} from "../../reducers/editors"
import {
  editors,
  goto,
  flows,
  str,
} from "../../actions"

const editorCommitResultGotoActionCreators = {
  [EditorTypes.PROPOSITION]: (entities, result) => {
    const proposition = entities.propositions[result.proposition]
    return goto.proposition(proposition)
  },
  [EditorTypes.PROPOSITION_JUSTIFICATION]: (entities, result) => {
    let propositionId
    if (result.proposition) {
      propositionId = result.proposition
    } else {
      assert(() => !!result.justification)
      const justificationId = result.justification
      const justification = entities.justifications[justificationId]
      switch (justification.target.type) {
        case JustificationTargetType.PROPOSITION: {
          propositionId = justification.target.entity.id
          break
        }
        default: {
          propositionId = justification.rootProposition.id
          break
        }
      }
    }

    const proposition = entities.propositions[propositionId]
    return goto.proposition(proposition)
  },
}

const gotoEditorCommitResultAction = (editorType, resultAction) => {
  const {entities, result} = resultAction.payload.result
  const gotoActionCreator = editorCommitResultGotoActionCreators[editorType]
  const gotoAction = gotoActionCreator(entities, result)
  return gotoAction
}

export function* commitEditorThenView() {

  yield takeEvery(str(flows.commitEditThenView), function* commitEditThenViewWorker(action) {
    const {editorType, editorId} = action.payload
    yield put(editors.commitEdit(editorType, editorId))
    let resultAction = null
    while (!resultAction) {
      const currResultAction = yield take(str(editors.commitEdit.result))
      if (currResultAction.payload.editorType === editorType && currResultAction.payload.editorId === editorId) {
        resultAction = currResultAction
      }
    }
    if (!resultAction.error) {
      yield put(gotoEditorCommitResultAction(editorType, resultAction))
    }
  })
}