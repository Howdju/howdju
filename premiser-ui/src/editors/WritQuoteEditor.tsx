import { schemaIds } from "howdju-common";

import WritQuoteEditorFields from "../WritQuoteEditorFields";
import withEditor from "@/editors/withEditor";
import { EditorTypes } from "@/reducers/editors";

/** A WritQuote editor. */
export default withEditor(
  EditorTypes.WRIT_QUOTE,
  WritQuoteEditorFields,
  "writQuote",
  schemaIds.writQuote
);
