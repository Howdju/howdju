import { put, takeEvery } from "typed-redux-saga";

import { CreateMediaExcerptInput, MediaExcerptInfo } from "howdju-common";

import { editors, flows, goto } from "../../actions";
import { editorType, editorId } from "@/pages/SubmitMediaExcerptPage";

export function* beginEditOfMediaExcerptFromInfo() {
  yield* takeEvery(
    flows.beginEditOfMediaExcerptFromInfo,
    function* beginEditOfMediaExcerptFromAnchorInfoWorker(action) {
      const input = toCreateMediaExcerptInput(action.payload);
      yield* put(editors.beginEdit(editorType, editorId, input));
      yield* put(goto.newMediaExcerpt());
    }
  );
}

function toCreateMediaExcerptInput(
  payload: MediaExcerptInfo
): CreateMediaExcerptInput {
  const {
    anchors,
    sourceDescription,
    authors: speakers,
    pincite,
    url,
  } = payload;
  const quotation = anchors?.map((a) => a.exactText.trim()).join("\n\n") ?? "";
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
    speakers,
  };
}
