import { CreateWritQuoteInput } from "howdju-common";

import WritQuoteEditorFields from "../WritQuoteEditorFields";
import withEditor from "@/editors/withEditor";
import { EditorTypes } from "@/reducers/editors";

/** A WritQuote editor. */
const CreateWritQuoteEditor = withEditor(
  EditorTypes.WRIT_QUOTE,
  WritQuoteEditorFields,
  "writQuote",
  CreateWritQuoteInput
  // TODO(273): add commit config
);

export default CreateWritQuoteEditor;
