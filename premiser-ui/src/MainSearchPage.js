import React, { Component } from 'react'
import { connect } from 'react-redux'
import map from 'lodash/map'

import StatementCard from './StatementCard'

class MainSearchPage extends Component {

  toCard = (entity) => (
      <StatementCard key={`statement-card-${entity.id}`}
                     className="md-cell md-cell--12"
                     statement={entity}
      />
  )

  render () {
    const {
      isFetching,
      statements,
    } = this.props
    const loading = <div className="md-cell md-cell--12">Loading&hellip;</div>
    const noResults = <div className="md-cell md-cell--12">No results.</div>
    return (
      <div className="md-grid md-grid--card-list">
        {isFetching ?
            loading :
            !statements.length ? noResults :
              map(statements, this.toCard)
        }
      </div>
    )
  }
}

const mapStateToProps = (state) => {
  const {
    ui: {
      mainSearchPage: {
        isFetching,
        statements,
      }
    }
  } = state
  return {
    isFetching,
    statements,
  }
}

export default connect(mapStateToProps)(MainSearchPage)