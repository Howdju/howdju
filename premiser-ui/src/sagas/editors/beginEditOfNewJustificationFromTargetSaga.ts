import { put, takeEvery } from "typed-redux-saga";

import {
  makeCreateJustifiedSentenceInput,
  JustificationBasisTypes,
} from "howdju-common";

import { editors, flows, str, goto } from "../../actions";
import CreatePropositionPage from "../../CreatePropositionPage";
import { PayloadAction } from "@reduxjs/toolkit";
import { PayloadType } from "@/actionHelpers";

type Payload = PayloadType<typeof flows.beginEditOfNewJustificationFromTarget>;

export function* beginEditOfNewJustificationFromTarget() {
  yield* takeEvery(
    str(flows.beginEditOfNewJustificationFromTarget),
    function* beginEditOfNewJustificationFromTargetWorker(
      action: PayloadAction<Payload>
    ) {
      const propositionJustification = toPropositionJustification(
        action.payload
      );
      yield* put(
        editors.beginEdit(
          CreatePropositionPage.editorType,
          CreatePropositionPage.editorId,
          propositionJustification
        )
      );
      yield* put(goto.createJustification());
    }
  );
}

function toPropositionJustification(payload: Payload) {
  const { content, source, target } = payload;
  const { title } = source;
  const quoteText = content.text.trim();
  const { url } = target;

  const writQuote = {
    quoteText,
    writ: {
      title,
    },
    urls: [{ url, target }],
  };
  const justificationProps = {
    basis: {
      type: JustificationBasisTypes.WRIT_QUOTE,
      writQuote,
    },
  };
  return makeCreateJustifiedSentenceInput(undefined, justificationProps);
}