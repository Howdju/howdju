import { put, takeEvery } from "typed-redux-saga";

import { CreateMediaExcerptInput } from "howdju-common";

import { editors, flows, str, goto } from "../../actions";
import { editorType, editorId } from "@/pages/SubmitMediaExcerptPage";
import { PayloadAction } from "@reduxjs/toolkit";
import { PayloadType } from "@/actionHelpers";

type Payload = PayloadType<typeof flows.submitMediaExcerptFromAnchorInfo>;

export function* submitMediaExcerptFromAnchorInfo() {
  yield* takeEvery(
    str(flows.submitMediaExcerptFromAnchorInfo),
    function* beginEditOfNewJustificationFromTargetWorker(
      action: PayloadAction<Payload>
    ) {
      const input = toCreateMediaExcerptInput(action.payload);
      yield* put(editors.beginEdit(editorType, editorId, input));
      yield* put(goto.submitMediaExcerpt());
    }
  );
}

function toCreateMediaExcerptInput(payload: Payload): CreateMediaExcerptInput {
  const { anchors, documentTitle, url } = payload;
  const quotation = anchors.map((a) => a.exactText.trim()).join("\n\n");
  return {
    localRep: {
      quotation,
    },
    // Should relate to localRep
    locators: {
      urlLocators: [{ url: { url }, anchors }],
    },
    citations: [
      {
        source: { descriptionApa: documentTitle },
      },
    ],
    speakers: [],
  };
}
