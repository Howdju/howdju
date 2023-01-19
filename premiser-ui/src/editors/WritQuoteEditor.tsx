import { schemaIds } from "howdju-common";

import WritQuoteEditorFields from "../WritQuoteEditorFields";
import withEditor from "@/editors/withEditor";
import { EditorTypes } from "@/reducers/editors";

/** A WritQuote editor. */
const WritQuoteEditor = withEditor(
  EditorTypes.WRIT_QUOTE,
  WritQuoteEditorFields,
  "writQuote",
  schemaIds.writQuote
);

export default WritQuoteEditor;
