import React from 'react'
import {Card, CardText} from 'react-md'
import {Link} from "react-router-dom"

import paths from "../paths"
import Helmet from '../Helmet'

import './PoliciesOverviewPage.scss'

const PoliciesOverviewPage = () => (
  <div className="md-grid policies">
    <Helmet>
      <title>Principles &amp; Policies — Howdju</title>
    </Helmet>
    <Card className="md-cell--12">
      <CardText>
        <h1 className="md-cell md-cell--12">Principles &amp; Policies</h1>

        <p>
          Howdju is a mission-driven organization, and we have articulated
          our <Link to={paths.principles()}>principles</Link>.
        </p>

        <h2>Policies</h2>

        We have written the following policies to support our principles, and to provide clear expectations on our
        relationship with our users.
        Your use of this website or any of Howdju&rsquo;s services are governed by these policies. If you do not agree to
        these policies, you must not use our Services.

        <ul>
          <li><Link to={paths.userAgreement()}>User Agreement</Link></li>
          <li><Link to={paths.codeOfConduct()}>Code of Conduct</Link></li>
          <li><Link to={paths.privacyPolicy()}>Privacy Policy</Link></li>
          <li><Link to={paths.cookieNotice()}>Cookie Notice</Link></li>
        </ul>

        <h2>Frequently asked questions</h2>

        Our <Link to={paths.faq()}>FAQ</Link> answers some frequently asked questions.
      </CardText>
    </Card>
  </div>
)
export default PoliciesOverviewPage
