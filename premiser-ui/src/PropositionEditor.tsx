import { UpdatePropositionInput } from "howdju-common";

import PropositionEditorFields from "./PropositionEditorFields";
import withEditor from "@/editors/withEditor";
import { EditorTypes } from "@/reducers/editors";

/** A WritQuote editor. */
const PropositionEditor = withEditor(
  EditorTypes.PROPOSITION,
  PropositionEditorFields,
  "proposition",
  UpdatePropositionInput
  // TODO(273): add commit config
);

export default PropositionEditor;
