import { schemaIds } from "howdju-common";

import withEditor from "@/editors/withEditor";
import ContentReportEditorFields from "./ContentReportEditorFields";

const ContentReportEditor = withEditor(
  "CONTENT_REPORT",
  ContentReportEditorFields,
  "contentReport",
  schemaIds.contentReport
);
export default ContentReportEditor;
