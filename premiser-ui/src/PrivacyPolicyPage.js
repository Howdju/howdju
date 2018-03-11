import React from 'react'
import {Card, CardText} from 'react-md'

import mdSource from './terms/privacy-policy.md'

import './PrivacyPolicyPage.scss'

const PrivacyPolicyPage = () => (
  <div className="md-grid">
    <Card className="md-cell--12">
      <CardText dangerouslySetInnerHTML={{ __html: mdSource}} />
    </Card>
  </div>
)
export default PrivacyPolicyPage
