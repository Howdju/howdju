import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import {
  api,
  mapActionCreatorGroupToDispatchToProps,
} from './actions'
import sortBy from 'lodash/sortBy'

import paths from './paths'

class HomePage extends Component {

  componentWillMount() {
    this.props.api.fetchStatements()
  }

  render () {
    return (
        <div className="md-grid">
          <h1>Home</h1>
          <div className="md-cell md-cell--12">
            <ul>
              {!this.props.statements.length ?
                  <div>Loading...</div> :
                  this.props.statements.map(s => <li key={s.id}><Link to={paths.statement(s)}>{s.text}</Link></li>)
              }
            </ul>
          </div>
        </div>
    )
  }
}

const mapStateToProps = (state) => {
  const {
    entities: {
      statements
    }
  } = state
  return {
    statements: sortBy(statements, ['text']),
  }
}

export default connect(mapStateToProps, mapActionCreatorGroupToDispatchToProps({
  api,
}))(HomePage)