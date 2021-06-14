import React, {Component} from 'react'
import {Button, Card, CardActions, CardText, CardTitle} from 'react-md'

import Helmet from './Helmet'
import EditableAccountSettings from "./EditableAccountSettings"
import {EditorTypes} from "./reducers/editors"
import {combineIds} from "./viewModels"
import {connect} from "react-redux"
import {api, editors, mapActionCreatorGroupToDispatchToProps} from "./actions"
import t, {EDIT_ENTITY_BUTTON_LABEL} from "./texts"
import get from "lodash/get"
import {isTruthy} from "howdju-common"
import {showPrivacyConsentDialog} from "./cookieConsent"

const baseId = 'accountSettingsPage'
const accountSettingsId = combineIds(baseId, 'accountSettings')
const accountSettingsEditorId = combineIds(baseId, 'accountSettings')

class AccountSettingsPage extends Component {

  componentDidMount() {
    this.props.api.fetchAccountSettings()
  }

  beginEdit = () => {
    this.props.editors.beginEdit(EditorTypes.ACCOUNT_SETTINGS, accountSettingsEditorId, this.props.accountSettings)
  }

  render() {
    const {
      accountSettings,
      isFetching,
      isEditing,
    } = this.props
    return (
      <div className="md-grid">
        <div className="md-cell md-cell--12">
          <Helmet>
            <title>Settings — Howdju</title>
          </Helmet>

          <h1>Settings</h1>

          <Card className="md-cell--12">
            <CardTitle
              title="Profile"
              subtitle="Your profile is the part of your account settings that are visible to other users"
            />
            <CardText>
              <EditableAccountSettings
                id={accountSettingsId}
                editorId={accountSettingsEditorId}
                className="md-cell md-cell--12"
                accountSettings={accountSettings}
                onSubmit={this.onSubmit}
              />
            </CardText>
            <CardActions>
              {!isEditing && (
                <Button raised
                        key="editButton"
                        children={t(EDIT_ENTITY_BUTTON_LABEL)}
                        disabled={isFetching}
                        onClick={this.beginEdit}
                />
              )}
            </CardActions>
          </Card>

        </div>
        <div className="md-cell md-cell--12">

          <Card className="md-cell--12">
            <CardTitle>Privacy settings</CardTitle>
            <CardText>
              <Button raised primary onClick={showPrivacyConsentDialog}>Show privacy consent dialog</Button>
            </CardText>
          </Card>

        </div>

      </div>
    )
  }
}

function mapStateToProps(state, ownProps) {
  const {isFetching, accountSettings} = state.ui.accountSettingsPage
  const {editEntity} = get(state.editors, [EditorTypes.ACCOUNT_SETTINGS, accountSettingsEditorId], {})
  const isEditing = isTruthy(editEntity)
  return {
    accountSettings,
    isFetching,
    isEditing,
  }
}

export default connect(mapStateToProps, mapActionCreatorGroupToDispatchToProps({
  api,
  editors,
}))(AccountSettingsPage)
