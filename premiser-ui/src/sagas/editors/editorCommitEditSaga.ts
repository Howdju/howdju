import { put, call, takeEvery, select } from "typed-redux-saga";
import isFunction from "lodash/isFunction";
import clone from "lodash/clone";
import drop from "lodash/drop";
import reverse from "lodash/reverse";

import {
  JustificationRootTargetTypes,
  JustificationTargetTypes,
  newProgrammingError,
  makeStatement,
  SentenceTypes,
  newUnimplementedError,
  CreateCounterJustificationInput,
  CreateJustificationInput,
  CreatePersorgInput,
  CreatePropositionInput,
} from "howdju-common";

import { selectEditorState } from "../../selectors";
import { EditorEntity, EditorType, EditorTypes } from "../../reducers/editors";
import { api, editors, str } from "../../actions";
import { consolidateCreateJustificationInput } from "../../viewModels";
import { newEditorCommitResultError } from "../../uiErrors";
import { callApiForResource } from "../resourceApiSagas";
import { CreateJustifiedPropositionInput } from "howdju-client-common";
import { EditorAction } from "@/editors/editorTypes";
import { startCase } from "lodash";
import app from "@/app/appSlice";
import { ActionCreator } from "@reduxjs/toolkit";

const CrudActions = { CREATE: "CREATE", UPDATE: "UPDATE" } as const;
type CrudAction = typeof CrudActions[keyof typeof CrudActions];
const UNSUPPORTED = {};
const editorTypeCommitApiResourceActions = {
  [EditorTypes.PROPOSITION]: {
    [CrudActions.UPDATE]: api.updateProposition,
  },
  [EditorTypes.PROPOSITION_JUSTIFICATION]: (
    model: CreateJustifiedPropositionInput,
    crudType: CrudAction
  ) => {
    switch (crudType) {
      case CrudActions.CREATE: {
        if (model.speakers && model.speakers.length > 0) {
          // If there are speakers, then we are creating a statement.  But is it justified or not?

          const statement = constructStatement(
            model.speakers,
            model.proposition
          );

          // If the statement is justified, then create a justification targeting the statement
          if (model.doCreateJustification) {
            const justification = consolidateCreateJustificationInput(
              model.justification
            );
            justification.rootTargetType =
              JustificationRootTargetTypes.STATEMENT;
            justification.target = {
              entity: statement,
              type: JustificationTargetTypes.STATEMENT,
            };
            return api.createJustification(justification);
          }

          return api.createStatement(statement);
        } else if (model.doCreateJustification) {
          const justification = consolidateCreateJustificationInput(
            model.justification
          );
          // It is sort of an arbitrary decision to create the justification instead of the proposition.
          // We could support creating a proposition and justification at the same
          // time by either targeting the proposition from the justification, or adding the justification to the proposition's
          // justifications (although the API does not support the latter yet.)
          justification.target.entity = model.proposition;
          return api.createJustification(justification);
        } else {
          return api.createProposition(model.proposition);
        }
      }
      case "UPDATE":
        throw newUnimplementedError(
          "Updating JustifiedPropositions is not supported"
        );
    }
  },
  [EditorTypes.COUNTER_JUSTIFICATION]: (
    model: CreateCounterJustificationInput,
    crudAction: CrudAction
  ) => {
    switch (crudAction) {
      case CrudActions.CREATE: {
        const justification = consolidateCreateJustificationInput(model);
        return api.createJustification(justification);
      }
      case "UPDATE":
        throw newUnimplementedError(
          "Updating CounterJustifications is not supported"
        );
    }
  },
  [EditorTypes.NEW_JUSTIFICATION]: (
    model: CreateJustificationInput,
    crudAction: CrudAction
  ) => {
    switch (crudAction) {
      case CrudActions.CREATE: {
        const justification = consolidateCreateJustificationInput(model);
        return api.createJustification(justification);
      }
      case "UPDATE":
        throw newUnimplementedError("Updating Justifications is not supported");
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
    [CrudActions.UPDATE]: api.updatePersorg,
  },
  [EditorTypes.ACCOUNT_SETTINGS]: {
    [CrudActions.CREATE]: api.createAccountSettings,
    [CrudActions.UPDATE]: api.updateAccountSettings,
  },
  [EditorTypes.CONTENT_REPORT]: {
    [CrudActions.CREATE]: api.createContentReport,
  },
  [EditorTypes.JUSTIFICATION_BASIS_COMPOUND]: UNSUPPORTED,
};

function constructStatement(
  speakers: CreatePersorgInput[],
  proposition: CreatePropositionInput
) {
  // In the UI the speakers are listed so that the last one is the one to say the proposition directly,
  // but we need to build the statements outward so that we have the target of the next statement.
  // So take them in reverse order
  speakers = reverse(clone(speakers));
  let statement = makeStatement({
    speaker: speakers[0],
    sentenceType: SentenceTypes.PROPOSITION,
    sentence: proposition,
  });
  for (const speaker of drop(speakers, 1)) {
    statement = makeStatement({
      speaker,
      sentenceType: SentenceTypes.STATEMENT,
      sentence: statement,
    });
  }
  return statement;
}

export function* editorCommitEdit() {
  yield takeEvery(
    str(editors.commitEdit),
    function* editorCommitEditWorker(action: EditorAction) {
      const { editorType, editorId } = action.payload;

      if (!editorType) {
        throw newProgrammingError("editorType is required");
      }
      if (!editorId) {
        throw newProgrammingError("editorId is required");
      }

      const { editEntity } = yield select(
        selectEditorState(editorType, editorId)
      );
      const editorCommitApiResourceAction = createEditorCommitApiResourceAction(
        editorType,
        editEntity
      );
      try {
        const resultAction = yield* call(
          callApiForResource,
          editorCommitApiResourceAction
        );
        if (resultAction.error) {
          return yield* put(
            editors.commitEdit.result(
              newEditorCommitResultError(
                editorType,
                editorId,
                resultAction.payload
              )
            )
          );
        } else {
          if (resultAction.payload.alreadyExists) {
            yield put(
              app.addToast(`That ${startCase(editorType)} already exists.`)
            );
          }
          return yield* put(
            editors.commitEdit.result(
              editorType,
              editorId,
              resultAction.payload
            )
          );
        }
      } catch (error) {
        return yield* put(
          editors.commitEdit.result(
            newEditorCommitResultError(editorType, editorId, error as Error)
          )
        );
      }
    }
  );
}

function createEditorCommitApiResourceAction(
  editorType: EditorType,
  editEntity: EditorEntity
) {
  const editorCommitApiResourceActions =
    editorTypeCommitApiResourceActions[editorType];
  if (editorCommitApiResourceActions === UNSUPPORTED) {
    throw newUnimplementedError(`Cannot edit ediitor type ${editorType}.`);
  }
  if (!editorCommitApiResourceActions) {
    throw new Error(`Missing editor type ${editorType} action creator config.`);
  }

  const crudType =
    !("id" in editEntity) || !editEntity.id
      ? CrudActions.CREATE
      : CrudActions.UPDATE;
  let action;
  if (isFunction(editorCommitApiResourceActions)) {
    action = editorCommitApiResourceActions(editEntity, crudType);
  } else {
    if (!(crudType in editorCommitApiResourceActions)) {
      throw new Error(
        `Missing ${crudType} action creator to commit edit of ${editorType} (add to editorTypeCommitApiResourceActions).`
      );
    }
    const actionCreator = editorCommitApiResourceActions[
      crudType as keyof typeof editorCommitApiResourceActions
    ] as ActionCreator<any>;
    action = actionCreator(editEntity);
  }
  return action;
}
