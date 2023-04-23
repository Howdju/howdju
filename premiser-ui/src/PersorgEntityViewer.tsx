import {
  CreatePersorgInput,
  PersorgOut,
  UpdatePersorgInput,
} from "howdju-common";

import EditablePersorg from "./EditablePersorg";
import withEntityViewer from "./withEntityViewer";
import paths from "./paths";

export default withEntityViewer<
  "persorg",
  CreatePersorgInput | UpdatePersorgInput | PersorgOut
>(EditablePersorg, "persorg", "person", "Person/Organization", paths.persorg);
