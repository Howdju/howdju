import React from 'react'
import {Card, CardText} from 'react-md'
import DOMPurify from 'dompurify'

import './PolicyPage.scss'
import Helmet from "../Helmet"
import { replace } from 'lodash'

interface Props {
  pageTitle: string
  innerHtml: string
}
const PolicyPage = (props: Props) => (
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

function processHtml(html: string) {
  return DOMPurify.sanitize(processCodes(html))
}

// Reconstruct emails dynamically to try and avoid automated email harvesting
const emailRegExp = /<span data-type="email" data-email-user="(.+?)" data-email-domain="(.+?)"><\/span>/g

function processCodes(html: string) {
  return replace(html, emailRegExp, '$1@$2')
}
