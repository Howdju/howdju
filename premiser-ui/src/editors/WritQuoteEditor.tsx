import WritQuoteEditorFields from "../WritQuoteEditorFields";
import withEditor from "@/editors/withEditor";
import { makeUrl, schemaIds } from "howdju-common";
import { editors } from "../actions";
import { AppDispatch } from "@/setupStore";
import { EditorType, EditorTypes } from "@/reducers/editors";

const lits = {
  onAddUrl:
    (editorType: EditorType, editorId: string, dispatch: AppDispatch) =>
    (index: number) =>
      dispatch(
        editors.addListItem(editorType, editorId, index, "urls", makeUrl)
      ),
  onRemoveUrl:
    (editorType: EditorType, editorId: string, dispatch: AppDispatch) =>
    (_url: string, index: number) =>
      dispatch(editors.removeListItem(editorType, editorId, index, "urls")),
};
/** A WritQuote editor. */
export default withEditor(
  EditorTypes.WRIT_QUOTE,
  WritQuoteEditorFields,
  "writQuote",
  schemaIds.writQuote,
  lits
);
