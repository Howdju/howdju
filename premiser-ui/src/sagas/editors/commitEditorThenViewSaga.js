import { take, put, takeEvery } from "redux-saga/effects";

import {
  assert,
  isTruthy,
  JustificationRootTargetTypes,
  JustificationTargetTypes,
  newImpossibleError,
} from "howdju-common";

import { EditorTypes } from "../../reducers/editors";
import { editors, goto, flows, str } from "../../actions";

const editorCommitResultGotoActionCreators = {
  [EditorTypes.PROPOSITION]: ({ proposition }) => goto.proposition(proposition),
  [EditorTypes.WRIT_QUOTE]: ({ writQuote }) => goto.writQuote(writQuote),
  [EditorTypes.JUSTIFIED_SENTENCE]: ({
    proposition,
    statement,
    justification,
  }) => {
    if (proposition) {
      return goto.proposition(proposition);
    }

    if (statement) {
      return goto.statement(statement);
    }

    assert(() => isTruthy(justification));
    switch (justification.target.type) {
      case JustificationTargetTypes.PROPOSITION: {
        return goto.proposition(justification.target.entity);
      }
      case JustificationTargetTypes.STATEMENT: {
        return goto.statement(justification.target.entity);
      }
    }

    assert(
      () => justification.target.type === JustificationTargetTypes.JUSTIFICATION
    );
    switch (justification.rootTargetType) {
      case JustificationRootTargetTypes.PROPOSITION: {
        return goto.proposition(justification.rootTarget);
      }
      case JustificationRootTargetTypes.STATEMENT: {
        return goto.statement(justification.rootTarget);
      }
    }

    throw newImpossibleError(
      `A justification must either target or be rooted in a JustificationRootTargetTypes`
    );
  },
};

const gotoEditorCommitResultAction = (editorType, resultAction) => {
  const gotoActionCreator = editorCommitResultGotoActionCreators[editorType];
  const gotoAction = gotoActionCreator(resultAction.payload.result);
  return gotoAction;
};

export function* commitEditorThenView() {
  yield takeEvery(
    str(flows.commitEditThenView),
    function* commitEditThenViewWorker(action) {
      const { editorType, editorId } = action.payload;
      yield put(editors.commitEdit(editorType, editorId));
      let resultAction = null;
      while (!resultAction) {
        const currResultAction = yield take(str(editors.commitEdit.result));
        if (
          currResultAction.payload.editorType === editorType &&
          currResultAction.payload.editorId === editorId
        ) {
          resultAction = currResultAction;
        }
      }
      if (!resultAction.error) {
        yield put(gotoEditorCommitResultAction(editorType, resultAction));
      }
    }
  );
}
