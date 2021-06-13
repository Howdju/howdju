import React, {Component} from 'react'
import {Button, Card, CardText} from 'react-md'

import Helmet from './Helmet'
import {showPrivacyConsentDialog} from "./cookieConsent"

export default class PrivacySettingsPage extends Component {
  componentDidMount() {
    showPrivacyConsentDialog()
  }

  render() {
    return (
      <div className="md-grid">
        <Helmet>
          <title>Privacy Settings — Howdju</title>
        </Helmet>
        <Card className="md-cell--12">
          <CardText>
            <h1 className="md-cell md-cell--12">Privacy Settings</h1>
            <Button raised primary onClick={showPrivacyConsentDialog}>Show privacy consent dialog</Button>
          </CardText>
        </Card>
      </div>
    )
  }
}
