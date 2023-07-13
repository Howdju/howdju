import SourceEditor from "./SourceEditor";
import SourceViewer from "./SourceViewer";
import withEditableEntity from "@/withEditableEntity";

export default withEditableEntity("SOURCE", SourceEditor, SourceViewer);
