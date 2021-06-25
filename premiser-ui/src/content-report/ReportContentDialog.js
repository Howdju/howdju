import React, {Component} from "react"
import {connect} from "react-redux"
import {Card, DialogContainer} from "react-md"

import {isTruthy, makeNewContentReport} from "howdju-common"

import {mapActionCreatorGroupToDispatchToProps, editors, ui} from "../actions"
import withEntityEditor from "../withEntityEditor"
import {EditorTypes} from "../reducers/editors"
import ContentReportEditorFields from "./ContentReportEditorFields"
import {combineIds} from "../viewModels"
import get from "lodash/get"

const baseId = 'reportContentDialog'
const id = combineIds(baseId, 'editor')
const editorId = combineIds(baseId, 'contentReportEditor')

class ReportContentDialog extends Component {

  componentDidUpdate(prevProps, prevState, snapshot) {
    const {
      isReportDialogVisible
    } = this.props
    if (isReportDialogVisible && !prevProps.isReportDialogVisible) {
      const {
        entityType,
        entityId,
      } = this.props
      const url = window.location.href
      this.props.editors.beginEdit(EditorTypes.CONTENT_REPORT, editorId, makeNewContentReport({entityType, entityId, url}))
    }
  }

  onHide = () => {
    this.props.ui.hideReportContentDialog()
  }

  onSubmit = () => {
    // const reportTypes = keys(pickBy(checkedByCode))
    this.props.ui.hideReportContentDialog()
  }

  render() {
    const {
      isReportDialogVisible,
      isEditing,
    } = this.props

    const ContentReportEditor = withEntityEditor(
      EditorTypes.CONTENT_REPORT, ContentReportEditorFields, 'contentReport')
    return (
      <DialogContainer
        id="report-content-dialog"
        title="Report Content"
        onHide={this.onHide}
        visible={isReportDialogVisible && isEditing}
        className="md-overlay--wide-dialog"
      >
        <div className="md-grid">
          <div className="md-cell md-cell--12">
            <form onSubmit={this.onSubmit}>
            <Card>
              <ContentReportEditor
                id={id}
                editorId={editorId}
                onSubmit={this.onSubmit}
                onCancel={this.onHide}
                submitText="Report"
              />
            </Card>
          </form>
          </div>
        </div>
      </DialogContainer>
    )
  }
}

const mapStateToProps = state => {
  const {
    isReportDialogVisible,
    entity: {
      entityType,
      entityId,
    },
  } = state.ui.reportContentDialog
  const {editEntity} = get(state.editors, [EditorTypes.CONTENT_REPORT, editorId], {})
  const isEditing = isTruthy(editEntity)

  return {
    entityType,
    entityId,
    isReportDialogVisible,
    isEditing,
  }
}

export default connect(mapStateToProps, mapActionCreatorGroupToDispatchToProps({
  editors,
  ui,
}))(ReportContentDialog)
