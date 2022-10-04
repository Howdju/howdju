import {
  put,
  call,
  takeEvery,
  select,
} from 'redux-saga/effects'
import isFunction from 'lodash/isFunction'
import clone from 'lodash/clone'
import drop from 'lodash/drop'
import reverse from 'lodash/reverse'

import {
  arrayToObject,
  JustificationRootTargetType,
  JustificationTargetType,
  newProgrammingError,
  makeNewStatement,
  SentenceType,
} from 'howdju-common'

import {
  selectEditorState,
} from "../../selectors"
import {EditorTypes, EntityTypeDescriptions} from "../../reducers/editors"
import {
  api,
  editors,
  str,
  ui,
} from "../../actions"
import {consolidateNewJustificationEntities} from '../../viewModels'
import {
  newEditorCommitResultError,
} from "../../uiErrors"
import {callApiForResource} from '../resourceApiSagas'
import { logger } from '@/logger'


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
        if (model.speakers && model.speakers.length > 0) {
          // If there are speakers, then we are creating a statement.  But is it justified or not?

          const statement = constructStatement(model.speakers, model.proposition)

          // If the statement is justified, then create a justification targeting the statement
          if (model.doCreateJustification) {
            const justification = consolidateNewJustificationEntities(model.newJustification)
            justification.rootTargetType = JustificationRootTargetType.STATEMENT
            justification.target = {
              entity: statement,
              type: JustificationTargetType.STATEMENT,
            }
            return api.createJustification(justification)
          }

          return api.createStatement(statement)

        } else if (model.doCreateJustification) {
          const justification = consolidateNewJustificationEntities(model.newJustification)
          // It is sort of an arbitrary decision to create the justification instead of the proposition.
          // We could support creating a proposition and justification at the same
          // time by either targeting the proposition from the justification, or adding the justification to the proposition's
          // justifications (although the API does not support the latter yet.)
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
    [CrudActions.CREATE]: api.createWritQuote,
    [CrudActions.UPDATE]: api.updateWritQuote,
  },
  [EditorTypes.LOGIN_CREDENTIALS]: {
    [CrudActions.CREATE]: api.login,
  },
  [EditorTypes.REGISTRATION_REQUEST]: {
    [CrudActions.CREATE]: api.requestRegistration,
  },
  [EditorTypes.REGISTRATION_CONFIRMATION]: {
    [CrudActions.CREATE]: api.confirmRegistration,
  },
  [EditorTypes.PERSORG]: {
    [CrudActions.UPDATE]: api.updatePersorg
  },
  [EditorTypes.ACCOUNT_SETTINGS]: {
    [CrudActions.CREATE]: api.createAccountSettings,
    [CrudActions.UPDATE]: api.updateAccountSettings,
  },
  [EditorTypes.CONTENT_REPORT]: {
    [CrudActions.CREATE]: api.createContentReport,
  },
}

function constructStatement(speakers, proposition) {
  // In the UI the speakers are listed so that the last one is the one to say the proposition directly,
  // but we need to build the statements outward so that we have the target of the next statement.
  // So take them in reverse order
  speakers = reverse(clone(speakers))
  let statement = makeNewStatement(speakers[0], SentenceType.PROPOSITION, proposition)
  for (const speaker of drop(speakers, 1)) {
    statement = makeNewStatement(speaker, SentenceType.STATEMENT, statement)
  }
  return statement
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
        if (resultAction.payload.alreadyExists) {
          let entityTypeDescription = EntityTypeDescriptions[editorType]
          if (!entityTypeDescription) {
            logger.warn(`No EntityTypeDesription for editorType ${editorType}`)
            entityTypeDescription = 'entity'
          }
          yield put(ui.addToast(`That ${entityTypeDescription} already exists.`))
        }
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
      throw new Error(`Missing ${crudType} action creator to commit edit of ${editorType} (add to editorTypeCommitApiResourceActions).`)
    }
    action = actionCreator(editEntity)
  }
  return action
}
