import React, { Component, PropTypes } from 'react'
import StatementJustifications from './StatementJustifications'
import Statement from './Statement'
import Justification from './Justification'

export default class StatementJustificationsContainer extends Component {

  statement = new Statement({
    id: 1,
    text: "The American Health Care Reform Act of 2017 (H.R.277) is an improvement over The Affordable Care Act"
  })
  justifications = [
    new Justification({
      id: 1,
      type: 'statement',
      basis: new Statement({text: "The American Health Care Reform Act of 2017 will reduce federal deficits by $337 by 2026"}),
      polarity: 'positive',
      score: 1,
    }),
    new Justification({
      id: 2,
      basis: new Statement({text: "The AHCA will uninsure 14 million people by 2018"}),
      polarity: 'negative',
      score: 2,
    }),
    new Justification({
      id: 3,
      basis: new Statement({text: "The AHCA is shorter than the ACA"}),
      polarity: 'positive',
      score: 3,
    }),
    new Justification({
      id: 4,
      basis: new Statement({text: "The AHCA removes the penalty for choosing not to have health insurance"}),
      polarity: 'positive',
      score: 4,
    }),
    new Justification({
      id: 5,
      basis: new Statement({text: "The removal of the individual mandate will drive up insurance costs and emergency care costs"}),
      polarity: 'negative',
      score: 5,
    })
  ]

  render() {
    console.log('statementId: ' + this.props.match.params.statementId)
    return <StatementJustifications statement={this.statement} justifications={this.justifications}/>
  }
}