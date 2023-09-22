import React from "react";
import { useDispatch } from "react-redux";
import { Card, DialogContainer } from "react-md";

import { isTruthy } from "howdju-common";

import app from "@/app/appSlice";
import { editors } from "../actions";
import { defaultEditorState } from "../reducers/editors";
import { combineIds } from "../viewModels";
import { RootState } from "@/setupStore";
import { useAppSelector } from "@/hooks";
import ContentReportEditor from "./ContentReportEditor";
import { CommitThenPutAction } from "@/editors/withEditor";

const baseId = "reportContentDialog";
const id = combineIds(baseId, "editor");
export const editorType = "CONTENT_REPORT";
const editorId = combineIds(baseId, "contentReportEditor");
export const contentReportEditorId = editorId;

export default function ReportContentDialog() {
  const dispatch = useDispatch();

  const { editEntity } = useAppSelector(
    (state: RootState) =>
      state.editors[editorType]?.[editorId] ?? defaultEditorState()
  );
  const isEditing = isTruthy(editEntity);

  return (
    <DialogContainer
      id="report-content-dialog"
      title="Report Content"
      onHide={() => dispatch(editors.cancelEdit(editorType, editorId))}
      visible={isEditing}
      className="md-overlay--wide-dialog"
    >
      <div className="md-grid report-content-dialog">
        <div className="md-cell md-cell--12">
          <Card>
            <ContentReportEditor
              id={id}
              commitBehavior={
                new CommitThenPutAction(app.addToast("Submitted report."))
              }
              editorId={editorId}
              submitButtonText="Report"
            />
          </Card>
        </div>
      </div>
    </DialogContainer>
  );
}
