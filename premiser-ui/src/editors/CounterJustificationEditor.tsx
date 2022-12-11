import {
  CreateCounterJustificationInput,
  CreatePropositionCompoundAtomInput,
  makePropositionCompoundAtom,
  PropositionCompoundAtom,
} from "howdju-common";

import { editors } from "../actions";
import { EditorType, EditorTypes } from "../reducers/editors";
import withEditor from "./withEditor";
import { AppDispatch } from "../setupStore";
import { CreateCounterJustificationConfig } from "../sagas/editors/editorCommitEditSaga";
import CounterJustificationEditorFields from "./CounterJustificationEditorFields";

const translators = {
  onAddPropositionCompoundAtom:
    (editorType: EditorType, editorId: string, dispatch: AppDispatch) =>
    (index: number) => {
      dispatch(
        editors.addListItem(
          editorType,
          editorId,
          index,
          ["basis", "propositionCompound", "atoms"],
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
        editors.removeListItem(editorType, editorId, index, [
          "basis",
          "propositionCompound",
          "atoms",
        ])
      );
      // Don't let the atoms be empty
      if (atoms.length <= 1) {
        dispatch(
          editors.addListItem(
            editorType,
            editorId,
            index,
            ["basis", "propositionCompound", "atoms"],
            makePropositionCompoundAtom
          )
        );
      }
    },
};

/** A new Justification editor. */
export default withEditor(
  EditorTypes.COUNTER_JUSTIFICATION,
  CounterJustificationEditorFields,
  "justification",
  CreateCounterJustificationInput,
  translators,
  CreateCounterJustificationConfig
);
