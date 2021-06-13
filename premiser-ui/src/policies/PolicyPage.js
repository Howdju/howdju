import React from 'react'
import {Card, CardText} from 'react-md'
import DOMPurify from 'dompurify'

import './PolicyPage.scss'
import Helmet from "../Helmet"

const PolicyPage = (props) => (
  <div className="md-grid policies">
    <Helmet>
      <title>{props.pageTitle} — Howdju Policies</title>
    </Helmet>
    <Card className="md-cell--12">
      <CardText dangerouslySetInnerHTML={{ __html: processHtml(props.innerHtml)}} />
    </Card>
  </div>
)
export default PolicyPage

function processHtml(html) {
  return DOMPurify.sanitize(processCodes(html))
}

const emailRegExp = /<span data-type="email" data-email-user="(.+)" data-email-domain="(.+)"><\/span>/g

function processCodes(html) {
  return html.replaceAll(emailRegExp, '$1@$2')
}
