import EditablePersorg from "./EditablePersorg";
import withEntityViewer from "./withEntityViewer";
import paths from "./paths";

export default withEntityViewer(
  "persorg",
  EditablePersorg,
  "person",
  "Person/Organization",
  paths.persorg
);
