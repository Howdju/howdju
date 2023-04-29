import { put, takeEvery } from "typed-redux-saga";

import {
  makeCreateJustifiedSentenceInput,
  JustificationBasisTypes,
} from "howdju-common";

import { editors, flows, str, goto } from "../../actions";
import { editorType, editorId } from "../../CreatePropositionPage";
import { PayloadAction } from "@reduxjs/toolkit";
import { PayloadType } from "@/actionHelpers";

type Payload = PayloadType<
  typeof flows.beginEditOfNewJustificationFromWritQuote
>;

export function* beginEditOfNewJustificationFromTarget() {
  yield* takeEvery(
    str(flows.beginEditOfNewJustificationFromWritQuote),
    function* beginEditOfNewJustificationFromTargetWorker(
      action: PayloadAction<Payload>
    ) {
      const propositionJustification = toJustifiedSentence(action.payload);
      yield* put(
        editors.beginEdit(editorType, editorId, propositionJustification)
      );
      yield* put(goto.createJustification());
    }
  );
}

function toJustifiedSentence(payload: Payload) {
  const { writQuote } = payload;
  const justificationProps = {
    basis: {
      type: JustificationBasisTypes.WRIT_QUOTE,
      writQuote,
    },
  };
  return makeCreateJustifiedSentenceInput(undefined, justificationProps);
}
