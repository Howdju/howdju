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
  typeof flows.beginEditOfNewJustificationFromAnchorInfo
>;

export function* beginEditOfNewJustificationFromTarget() {
  yield* takeEvery(
    str(flows.beginEditOfNewJustificationFromAnchorInfo),
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
  const { anchors, documentTitle, url } = payload;
  const justificationProps = {
    basis: {
      type: JustificationBasisTypes.WRIT_QUOTE,
      writQuote: {
        url,
        quoteText: anchors.map((a) => a.exactText.trim()).join("\n\n"),
        writ: {
          title: documentTitle,
        },
        // TODO(38) replace `urls` with `locators: [{anchors, url}]`?
        // (no need for intermediate `target` prop, and name `locators` better reflects the purpose of
        // 'a thing to help you locate remotely the authority that is represented locally.')
        urls: [{ target: { anchors }, url }],
      },
    },
  };
  return makeCreateJustifiedSentenceInput(undefined, justificationProps);
}
