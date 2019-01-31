import React from 'react'
import {Card, CardText} from 'react-md'

import mdSource from './terms/terms.md'

import './TermsPage.scss'

const TermsPage = () => (
  <div className="md-grid">
    <Card className="md-cell--12">
      <CardText dangerouslySetInnerHTML={{ __html: mdSource}} />
    </Card>
  </div>
)
export default TermsPage
