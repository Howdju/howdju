import React from 'react'
import Card from 'react-md/lib/Cards/Card'
import CardText from 'react-md/lib/Cards/CardText'

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
