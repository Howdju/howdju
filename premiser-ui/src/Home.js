import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { fetchStatements } from './actions'

class Home extends Component {

  componentWillMount() {
    this.props.fetchStatements()
  }

  render () {
    return (
        <ul>
          {this.props.statements.map(s => <li key={s.id}><Link to={'/s/' + s.id + '/' + s.slug}>{s.text}</Link></li>)}
        </ul>
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
    statements: _.sortBy(statements, ['text']),
  }
}

export default connect(mapStateToProps, {
      fetchStatements
    })(Home)