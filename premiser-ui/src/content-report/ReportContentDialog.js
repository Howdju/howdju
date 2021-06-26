import React, {Component} from "react"
import {connect} from "react-redux"
import {Card, DialogContainer} from "react-md"
import get from "lodash/get"

import {isTruthy, schemaIds} from "howdju-common"

import {mapActionCreatorGroupToDispatchToProps, editors, ui} from "../actions"
import withEntityEditor from "../withEntityEditor"
import {EditorTypes} from "../reducers/editors"
import ContentReportEditorFields from "./ContentReportEditorFields"
import {combineIds} from "../viewModels"

const baseId = 'reportContentDialog'

class ReportContentDialog extends Component {
  static id = combineIds(baseId, 'editor')
  static editorId = combineIds(baseId, 'contentReportEditor')
  static editorType = EditorTypes.CONTENT_REPORT

  onHide = () => {
    this.props.editors.cancelEdit(EditorTypes.CONTENT_REPORT, editorId)
  }

  render() {
    const {
      isEditing,
    } = this.props

    const ContentReportEditor = withEntityEditor(
      EditorTypes.CONTENT_REPORT, ContentReportEditorFields, 'contentReport',
      schemaIds.contentReport)
    return (
      <DialogContainer
        id="report-content-dialog"
        title="Report Content"
        onHide={this.onHide}
        visible={isEditing}
        className="md-overlay--wide-dialog"
      >
        <div className="md-grid">
          <div className="md-cell md-cell--12">
            <Card>
              <ContentReportEditor
                id={ReportContentDialog.id}
                editorId={ReportContentDialog.editorId}
                submitText="Report"
              />
            </Card>
          </div>
        </div>
      </DialogContainer>
    )
  }
}

const mapStateToProps = state => {
  const {editEntity} = get(state.editors, [ReportContentDialog.editorType, ReportContentDialog.editorId], {})
  const isEditing = isTruthy(editEntity)

  return {
    isEditing,
  }
}

export default connect(mapStateToProps, mapActionCreatorGroupToDispatchToProps({
  editors,
  ui,
}))(ReportContentDialog)
