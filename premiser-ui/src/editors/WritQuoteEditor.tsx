import { UpdateWritQuoteInput } from "howdju-common";

import WritQuoteEditorFields from "../WritQuoteEditorFields";
import withEditor from "@/editors/withEditor";
import { EditorTypes } from "@/reducers/editors";

/** A WritQuote editor. */
const WritQuoteEditor = withEditor(
  EditorTypes.WRIT_QUOTE,
  WritQuoteEditorFields,
  "writQuote",
  UpdateWritQuoteInput
  // TODO(273): add commit config
);

export default WritQuoteEditor;
