import classNames from 'classnames'
import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import { denormalize } from 'normalizr'
import DocumentTitle from 'react-document-title'
import _ from 'lodash/core'

import { extractDomain } from './util'
import { JustificationTargetType, JustificationPolarity, JustificationBasisType} from './models'
import './StatementJustificationsPage.css'
import {acceptJustification, rejectJustification, fetchStatementJustifications} from "./actions"
import {statementJustificationsSchema} from "./schemas"


class StatementJustificationsPage extends Component {

  componentWillMount() {
    this.props.fetchStatementJustifications(this.props.match.params.statementId)
  }

  render () {
    return (
        <DocumentTitle title={`${this.props.statement.text} - Howdju`}>
          <div className="statement-justifications">
            <div className="statement">
              {this.props.statement.text}
            </div>
            <div className="justifications">
              {!this.props.justifications.length ?
                  <div>Loading...</div> :
                  this.props.justifications.map(j => (
                    <div key={j.id} className={classNames({justification: true, positive: j.polarity === JustificationPolarity.POSITIVE, negative: j.polarity === JustificationPolarity.NEGATIVE})}>
                      {j.basis.type === JustificationBasisType.STATEMENT ? j.basis.entity.text : j.basis.entity.quote}
                      {j.basis.type === JustificationBasisType.REFERENCE &&
                        <a href={j.basis.entity.urls[0].url}>{extractDomain(j.basis.entity.urls[0].url)}</a>
                      }
                    </div>
                  ))
              }
            </div>
          </div>
        </DocumentTitle>
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  const statement = state.entities.statements[ownProps.match.params.statementId] || {}
  const justifiesStatement = j =>
    j.target.type === JustificationTargetType.STATEMENT &&
    j.target.entity.id === statement.id
  const justifications = _(state.entities.justifications)
      .filter(justifiesStatement)
      .sortBy(j => j.score)
      .value()
  const statementJustifications = {
    statement: statement,
    justifications: justifications,
  }
  const denormalized = denormalize(statementJustifications, statementJustificationsSchema, state.entities)
  return denormalized
}

export default connect(mapStateToProps, {
  fetchStatementJustifications,
  acceptJustification,
  rejectJustification,
})(StatementJustificationsPage)