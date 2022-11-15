import { editors } from "./actions";
import { EditorType, EditorTypes } from "./reducers/editors";
import JustificationEditorFields from "./JustificationEditorFields";
import { makePropositionCompoundAtom, makeUrl, schemaIds } from "howdju-common";
import withEditor from "./editors/withEditor";
import { AppDispatch } from "./setupStore";

const translators = {
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
  onAddPropositionCompoundAtom:
    (editorType: EditorType, editorId: string, dispatch: AppDispatch) =>
    (index: number) => {
      dispatch(
        editors.addListItem(
          editorType,
          editorId,
          index,
          "basis.propositionCompound.atoms",
          makePropositionCompoundAtom
        )
      );
    },
  onRemovePropositionCompoundAtom:
    (editorType: EditorType, editorId: string, dispatch: AppDispatch) =>
    (index: number) => {
      dispatch(
        editors.removeListItem(
          editorType,
          editorId,
          index,
          "basis.propositionCompound.atoms"
        )
      );
    },
};

// translateJustificationErrorsFromFormInput?

/** A new Justification editor. */
export default withEditor(
  EditorTypes.NEW_JUSTIFICATION,
  JustificationEditorFields,
  "justification",
  schemaIds.newJustification,
  translators
);
