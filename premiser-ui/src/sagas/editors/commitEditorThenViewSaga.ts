import { take, put, takeEvery, race, call, delay } from "typed-redux-saga";

import {
  AppearanceOut,
  assert,
  isTruthy,
  JustificationOut,
  JustificationTargetTypes,
  MediaExcerptOut,
  PropositionOut,
  StatementOut,
  toJson,
} from "howdju-common";

import { EditorType } from "../../reducers/editors";
import { editors, goto, flows } from "../../actions";
import config from "@/config";
import { logger } from "@/logger";
import { push } from "connected-react-router";
import paths from "@/paths";
import { EditorId } from "@/types";

export const editorCommitResultGotoActionCreators = {
  PROPOSITION: ({ proposition }: { proposition: PropositionOut }) =>
    goto.proposition(proposition),
  JUSTIFIED_SENTENCE: ({
    proposition,
    statement,
    justification,
  }: {
    proposition: PropositionOut;
    statement: StatementOut;
    justification: JustificationOut;
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
      case "JUSTIFICATION": {
        return goto.justification(justification.target.entity);
      }
    }
  },
  MEDIA_EXCERPT: ({ mediaExcerpt }: { mediaExcerpt: MediaExcerptOut }) =>
    goto.mediaExcerpt(mediaExcerpt),
  APPEARANCE: ({ appearance }: { appearance: AppearanceOut }) =>
    push(paths.appearance(appearance)),
};

export type ViewableEditorType = Extract<
  EditorType,
  keyof typeof editorCommitResultGotoActionCreators
>;

function gotoEditorCommitResultAction(
  editorType: ViewableEditorType,
  resultAction: ReturnType<typeof editors.commitEdit.result>
) {
  const gotoActionCreator = editorCommitResultGotoActionCreators[editorType];
  if (!gotoActionCreator) {
    throw new Error(
      `No goto action creator for editor type ${editorType} in editorCommitResultGotoActionCreators`
    );
  }
  const gotoAction = gotoActionCreator(resultAction.payload.result);
  return gotoAction;
}

export function* commitEditorThenView() {
  yield* takeEvery(
    flows.commitEditThenView,
    function* commitEditThenViewWorker(action) {
      const { editorType, editorId } = action.payload;
      yield* put(editors.commitEdit(editorType, editorId));
      const { resultAction, timeout } = yield* race({
        resultAction: call(getResultAction, editorType, editorId),
        timeout: delay(config.commitEditThenViewResponseTimeoutMs),
      });
      if (resultAction) {
        if (!resultAction.error) {
          yield* put(gotoEditorCommitResultAction(editorType, resultAction));
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

function* getResultAction(editorType: EditorType, editorId: EditorId) {
  while (true) {
    const resultAction = yield* take(editors.commitEdit.result);
    if (
      resultAction.payload.editorType === editorType &&
      resultAction.payload.editorId === editorId
    ) {
      return resultAction;
    }
  }
}
