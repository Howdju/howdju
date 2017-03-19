import React, { Component, PropTypes } from 'react'
import classNames from 'classnames';
import Helmet from 'react-helmet'
import { JustificationType } from './Justification'
import './StatementJustifications.css'

function extractDomain(url) {
  let domain;
  //find & remove protocol (http, ftp, etc.) and get domain
  if (url.indexOf("://") > -1) {
    domain = url.split('/')[2];
  }
  else {
    domain = url.split('/')[0];
  }

  //find & remove port number
  domain = domain.split(':')[0];

  return domain;
}

export default class StatementJustifications extends Component {
  render () {
    return (
        <div className="statement-justifications">
          <Helmet title={this.props.statement.text + ' - Howdju'} />
          <div className="statement">
            {this.props.statement.text}
          </div>
          <div className="justifications">
            {this.props.justifications.map(j => (
                <div key={j.id} className={classNames({justification: true, positive: j.polarity === 'positive', negative: j.polarity === 'negative'})}>
                  {j.basis.text}
                  {j.type === JustificationType.QUOTE && (<a href={j.basis.citation.sources[0].url}>{extractDomain(j.basis.citation.sources[0].url)}</a>)}
                </div>
            ))}
          </div>
        </div>
    )
  }
}
