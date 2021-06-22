import React, {Component} from "react"
import {connect} from "react-redux"
import {Button, Card, CardActions, CardText, DialogContainer} from "react-md"
import map from "lodash/map"
import keys from "lodash/keys"
import pickBy from "lodash/pickBy"

import {schemaSettings} from "howdju-common"

import {mapActionCreatorGroupToDispatchToProps, ui} from "./actions"
import Checkbox from "./Checkbox"
import TextField from "./TextField"

const  reportTypes = {
  "HARASSMENT": "Harassment",
  "THREATENING_VIOLENCE": "Threatening violence",
  "HATE": "Hateful content",
  "OBSCENE": "Obscene content (excessively sexual, violent, or gory)",
  "SEXUALIZATION_OF_MINORS": "Sexualization of minors",
  "SHARING_PRIVATE_PERSONAL_INFORMATION": "Sharing private personal information",
  "PORNOGRAPHY": "Pornography",
  "ILLEGAL_ACTIVITY": "Illegal activity",
  "IMPERSONATION": "Impersonation",
  "COPYRIGHT_VIOLATION": "Copyright violation",
  "TRADEMARK_VIOLATION": "Trademark violation",
  "SPAM": "Spam",
  "OTHER": "Other",
}

class ReportContentDialog extends Component {
  state = {
    checkedByCode: {},
  }

  onCheckedPropertyChange = (checkedByCode, event) => {
    this.props.ui.editReportContentDialogForm({checkedByCode})
  }

  onDescriptionPropertyChange = (propertyChanges)  => {
    this.props.ui.editReportContentDialogForm(propertyChanges)
  }

  onHide = () => {
    this.props.ui.hideReportContentDialog()
  }

  onSubmit = () => {
    const {
      entityType,
      entityId,
      form,
    } = this.props
    const {
      checkedByCode,
      description,
    } = form
    const reportTypes = keys(pickBy(checkedByCode))
    const currentUrl = window.location.href
    this.props.api.reportContent(entityType, entityId, reportTypes, description, currentUrl)
    this.props.ui.hideReportContentDialog()
  }

  render() {
    const {
      form,
      isReportDialogVisible,
    } = this.props
    const {
      checkedByCode,
      description,
    } = form

    return (
      <DialogContainer
        id="report-content-dialog"
        title="Report Content"
        onHide={this.onHide}
        visible={isReportDialogVisible}
        className="md-overlay--wide-dialog"
      >
        <div className="md-grid">
          <div className="md-cell md-cell--12">
            <form onSubmit={this.onSubmit}>
            <Card>
              <CardText>
                {map(reportTypes, (description, code)  => (
                  <Checkbox
                    id={`${code}-checkbox`}
                    key={code}
                    name={code}
                    label={description}
                    value={code}
                    checked={checkedByCode[code]}
                    onPropertyChange={this.onCheckedPropertyChange}
                  />
                ))}
                <TextField
                  id="report-content-dialog-description"
                  key="description"
                  name="description"
                  label="Description"
                  rows={2}
                  maxRows={8}
                  maxLength={schemaSettings.reportContentDescriptionMaxLength}
                  value={description}
                  onPropertyChange={this.onDescriptionPropertyChange}
                />
              </CardText>
              <CardActions>
                <Button flat onClick={this.onHide}>Cancel</Button>
                <Button raised primary onClick={this.onSubmit}>Report</Button>
              </CardActions>
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
    form,
    isReportDialogVisible,
    entity: {
      entityType,
      entityId,
    },
  } = state.ui.reportContentDialog

  return {
    form,
    entityType,
    entityId,
    isReportDialogVisible,
  }
}

export default connect(mapStateToProps, mapActionCreatorGroupToDispatchToProps({
  ui,
}))(ReportContentDialog)
