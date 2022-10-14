import React from "react"
import { useDispatch } from "react-redux"
import { Card, DialogContainer } from "react-md"

import { isTruthy, schemaIds } from "howdju-common"

import { editors } from "../actions"
import { EditorTypes } from "../reducers/editors"
import ContentReportEditorFields from "./ContentReportEditorFields"
import { combineIds } from "../viewModels"
import { RootState } from "@/store"
import { useAppSelector } from "@/hooks"
import withEditor from "@/editors/withEditor"

const baseId = "reportContentDialog"
const id = combineIds(baseId, 'editor')
const editorType = EditorTypes.CONTENT_REPORT
const editorId = combineIds(baseId, 'contentReportEditor')

export default function ReportContentDialog() {
  const dispatch = useDispatch()

  const { editEntity } = useAppSelector((state: RootState) =>
    state.editors?.[editorType]?.[editorId] ?? {})
  const isEditing = isTruthy(editEntity)

  const ContentReportEditor = withEditor(
    EditorTypes.CONTENT_REPORT,
    ContentReportEditorFields,
    "contentReport",
    schemaIds.contentReport
  )
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
              name="report-content-editor"
              editorCommitBehavior='JustCommit'
              editorId={editorId}
              submitButtonText="Report"
            />
          </Card>
        </div>
      </div>
    </DialogContainer>
  )
}
