import { schemaIds } from "howdju-common";

import PersorgEditorFields from "./PersorgEditorFields";
import withEditor from "./editors/withEditor";

export default withEditor(
  "PERSORG",
  PersorgEditorFields,
  "persorg",
  schemaIds.persorg
);
