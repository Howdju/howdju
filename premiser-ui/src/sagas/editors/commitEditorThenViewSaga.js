import { take, put, takeEvery, race, call, delay } from "redux-saga/effects";

import {
  assert,
  isTruthy,
  JustificationRootTargetTypes,
  JustificationTargetTypes,
  newImpossibleError,
  toJson,
} from "howdju-common";

import { EditorTypes } from "../../reducers/editors";
import { editors, goto, flows, str } from "../../actions";
import config from "@/config";
import { logger } from "@/logger";
import { push } from "connected-react-router";
import paths from "@/paths";

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
  MEDIA_EXCERPT: ({ mediaExcerpt }) => goto.mediaExcerpt(mediaExcerpt),
  APPEARANCE: ({ appearance }) => push(paths.appearance(appearance)),
};

const gotoEditorCommitResultAction = (editorType, resultAction) => {
  const gotoActionCreator = editorCommitResultGotoActionCreators[editorType];
  if (!gotoActionCreator) {
    throw new Error(
      `No goto action creator for editor type ${editorType} in editorCommitResultGotoActionCreators`
    );
  }
  const gotoAction = gotoActionCreator(resultAction.payload.result);
  return gotoAction;
};

export function* commitEditorThenView() {
  yield takeEvery(
    str(flows.commitEditThenView),
    function* commitEditThenViewWorker(action) {
      const { editorType, editorId } = action.payload;
      yield put(editors.commitEdit(editorType, editorId));
      const { resultAction, timeout } = yield race({
        resultAction: call(getResultAction, editorType, editorId),
        timeout: delay(config.commitEditThenViewResponseTimeoutMs),
      });
      if (resultAction) {
        if (!resultAction.error) {
          yield put(gotoEditorCommitResultAction(editorType, resultAction));
        } else {
          logger.info(`Error commiting editor: ${toJson(resultAction.error)}`);
        }
      } else if (timeout) {
        logger.error("Timed out waiting for commitEdit result action");
      } else {
        logger.error(
          "Unexpected condition in commitEditorThenView: resultAction and timeout are both falsy"
        );
      }
    }
  );
}

function* getResultAction(editorType, editorId) {
  while (true) {
    const resultAction = yield take(str(editors.commitEdit.result));
    if (
      resultAction.payload.editorType === editorType &&
      resultAction.payload.editorId === editorId
    ) {
      return resultAction;
    }
  }
}
