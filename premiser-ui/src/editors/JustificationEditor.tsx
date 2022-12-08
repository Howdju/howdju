import { editors } from "../actions";
import { EditorType, EditorTypes } from "../reducers/editors";
import JustificationEditorFields from "./JustificationEditorFields";
import {
  CreateJustificationInput,
  CreatePropositionCompoundAtomInput,
  makePropositionCompoundAtom,
  makeUrl,
  PropositionCompoundAtom,
} from "howdju-common";
import withEditor from "./withEditor";
import { AppDispatch } from "../setupStore";
import { CreateJustificationConfig } from "../sagas/editors/editorCommitEditSaga";

const translators = {
  onAddUrl:
    (editorType: EditorType, editorId: string, dispatch: AppDispatch) =>
    (index: number) =>
      dispatch(
        editors.addListItem(
          editorType,
          editorId,
          index,
          "basis.writQuote.urls",
          makeUrl
        )
      ),
  onRemoveUrl:
    (editorType: EditorType, editorId: string, dispatch: AppDispatch) =>
    (_url: string, index: number) =>
      dispatch(
        editors.removeListItem(
          editorType,
          editorId,
          index,
          "basis.writQuote.urls"
        )
      ),
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
    (
      _atom: PropositionCompoundAtom,
      index: number,
      atoms: CreatePropositionCompoundAtomInput[]
    ) => {
      dispatch(
        editors.removeListItem(
          editorType,
          editorId,
          index,
          "basis.propositionCompound.atoms"
        )
      );
      // Don't let the atoms be empty
      if (atoms.length <= 1) {
        dispatch(
          editors.addListItem(
            editorType,
            editorId,
            index,
            "basis.propositionCompound.atoms",
            makePropositionCompoundAtom
          )
        );
      }
    },
};

/** A new Justification editor. */
export default withEditor(
  EditorTypes.NEW_JUSTIFICATION,
  JustificationEditorFields,
  "justification",
  CreateJustificationInput,
  translators,
  CreateJustificationConfig
);
