import EditableSource from "./EditableSource";
import withEntityViewer from "@/withEntityViewer";
import paths from "@/paths";

export default withEntityViewer(
  /*entityPropName=*/ "source",
  EditableSource,
  /*iconName=*/ "import_contacts",
  /*iconTitle=*/ "Source",
  paths.source
);
