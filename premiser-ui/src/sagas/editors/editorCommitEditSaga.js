import {
  put,
  call,
  takeEvery,
  select,
} from 'redux-saga/effects'
import isFunction from 'lodash/isFunction'

import {
  arrayToObject,
  newProgrammingError,
} from 'howdju-common'

import {
  selectEditorState,
} from "../../selectors"
import {EditorTypes} from "../../reducers/editors"
import {
  api,
  editors,
  str,
} from "../../actions"
import {consolidateNewJustificationEntities} from '../../viewModels'
import {
  newEditorCommitResultError,
} from "../../uiErrors"
import {callApiForResource} from '../resourceApiSagas'


const CrudActions = arrayToObject([
  'CREATE',
  'UPDATE',
])
const editorTypeCommitApiResourceActions = {
  [EditorTypes.PROPOSITION]: {
    [CrudActions.UPDATE]: api.updateProposition
  },
  [EditorTypes.PROPOSITION_JUSTIFICATION]: (model, crudType) => {
    switch (crudType) {
      case CrudActions.CREATE: {
        if (model.doCreateJustification) {
          const justification = consolidateNewJustificationEntities(model.newJustification)
          // This is sort of an arbitrary decision.  We could support creating a proposition and justification at the same
          // time by either targeting the proposition from the justification, or adding the justification to the proposition's
          // justifications (although technicall I don't think the API supports the later yet.)
          justification.target.entity = model.proposition
          return api.createJustification(justification)
        } else {
          return api.createProposition(model.proposition)
        }
      }
    }
  },
  [EditorTypes.COUNTER_JUSTIFICATION]: (model, crudAction) => {
    switch (crudAction) {
      case CrudActions.CREATE: {
        const justification = consolidateNewJustificationEntities(model)
        return api.createJustification(justification)
      }
    }
  },
  [EditorTypes.NEW_JUSTIFICATION]: (model, crudAction) => {
    switch (crudAction) {
      case CrudActions.CREATE: {
        const justification = consolidateNewJustificationEntities(model)
        return api.createJustification(justification)
      }
    }
  },
  [EditorTypes.WRIT_QUOTE]: {
    [CrudActions.UPDATE]: api.updateWritQuote
  },
  [EditorTypes.LOGIN_CREDENTIALS]: {
    [CrudActions.CREATE]: api.login,
  },
}

export function* editorCommitEdit() {

  yield takeEvery(str(editors.commitEdit), function* editorCommitEditWorker(action) {
    const {
      editorType,
      editorId,
    } = action.payload

    if (!editorType) {
      throw newProgrammingError("editorType is required")
    }
    if (!editorId) {
      throw newProgrammingError("editorId is required")
    }

    const {editEntity} = yield select(selectEditorState(editorType, editorId))
    const editorCommitApiResourceAction = createEditorCommitApiResourceAction(editorType, editEntity)
    const meta = {
      editEntity
    }
    try {
      const resultAction = yield call(callApiForResource, editorCommitApiResourceAction)
      if (resultAction.error) {
        return yield put(editors.commitEdit.result(newEditorCommitResultError(editorType, editorId, resultAction.payload), meta))
      } else {
        return yield put(editors.commitEdit.result(editorType, editorId, resultAction.payload, meta))
      }
    } catch (error) {
      return yield put(editors.commitEdit.result(newEditorCommitResultError(editorType, editorId, error), meta))
    }
  })
}

function createEditorCommitApiResourceAction(editorType, editEntity) {

  const editorCommitApiResourceActions = editorTypeCommitApiResourceActions[editorType]
  if (!editorCommitApiResourceActions) {
    throw new Error(`Missing editor type ${editorType} action creator config.`)
  }

  const crudType = editEntity.id ? CrudActions.UPDATE : CrudActions.CREATE
  let action
  if (isFunction(editorCommitApiResourceActions)) {
    action = editorCommitApiResourceActions(editEntity, crudType)
  } else {
    const actionCreator = editorCommitApiResourceActions[crudType]
    if (!actionCreator) {
      throw new Error(`Missing ${crudType} action creator to commit edit of ${editorType}.`)
    }
    action = actionCreator(editEntity)
  }
  return action
}
