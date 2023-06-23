import { put, takeEvery } from "typed-redux-saga";

import { CreateMediaExcerptInput } from "howdju-common";

import { editors, flows, str, goto } from "../../actions";
import { editorType, editorId } from "@/pages/SubmitMediaExcerptPage";
import { PayloadAction } from "@reduxjs/toolkit";
import { PayloadType } from "@/actionHelpers";

type Payload = PayloadType<typeof flows.beginEditOfMediaExcerptFromAnchorInfo>;

export function* beginEditOfMediaExcerptFromAnchorInfo() {
  yield* takeEvery(
    str(flows.beginEditOfMediaExcerptFromAnchorInfo),
    function* beginEditOfMediaExcerptFromAnchorInfoWorker(
      action: PayloadAction<Payload>
    ) {
      const input = toCreateMediaExcerptInput(action.payload);
      yield* put(editors.beginEdit(editorType, editorId, input));
      yield* put(goto.newMediaExcerpt());
    }
  );
}

function toCreateMediaExcerptInput(payload: Payload): CreateMediaExcerptInput {
  const { anchors, sourceDescription, authors, pincite, url } = payload;
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
        source: { description: sourceDescription },
        pincite,
      },
    ],
    speakers: authors?.map((author) => ({
      name: author,
      isOrganization: false,
    })),
  };
}
