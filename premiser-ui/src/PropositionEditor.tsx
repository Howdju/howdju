import {
  CreatePropositionInput,
  PropositionOut,
  UpdatePropositionInput,
} from "howdju-common";

import PropositionEditorFields from "./PropositionEditorFields";
import withEditor from "@/editors/withEditor";
import { EditorTypes } from "@/reducers/editors";

/** A Proposition editor. */
const PropositionEditor = withEditor(
  EditorTypes.PROPOSITION,
  PropositionEditorFields,
  "proposition",
  UpdatePropositionInput
  // TODO(273): add commit config
);

/** Remove the fields that are circular, unserializable, or not part of the API update model. */
export function toUpdatePropositionInput(
  proposition: PropositionOut
): UpdatePropositionInput {
  return {
    id: proposition.id,
    text: proposition.text,
  };
}

/** Remove the fields that are circular, unserializable, or not part of the API update model. */
export function toCreatePropositionInput(
  proposition: PropositionOut
): CreatePropositionInput {
  return {
    text: proposition.text,
  };
}

export default PropositionEditor;
