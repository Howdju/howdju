import React, { Component, PropTypes } from 'react'
import classNames from 'classnames';
import Statement from './Statement'
import './StatementJustifications.css'

export default class StatementJustifications extends Component {
  constructor(props) {
    super(props);
    this.state = {statement: new Statement(), justifications: []};
  }
  render () {
    return (
        <div className="statement-justifications">
          <div className="statement">
            {this.props.statement.text}
          </div>
          <div className="justifications">
            {this.props.justifications.map(j => (
                <div key={j.id} className={classNames({justification: true, positive: j.polarity === 'positive', negative: j.polarity === 'negative'})}>
                  {j.basis.text}
                </div>
            ))}
          </div>
        </div>
    )
  }
}
