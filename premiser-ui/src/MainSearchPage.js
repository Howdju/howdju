import React, { Component } from 'react'
import { connect } from 'react-redux'
import map from 'lodash/map'

import mainSearcher from './mainSearcher'
import StatementCard from './StatementCard'
import {
  app,
  mapActionCreatorGroupToDispatchToProps,
} from './actions'

class MainSearchPage extends Component {

  componentDidMount() {
    const searchText = mainSearcher.mainSearchText(this.props.location)
    this.fetchResults(searchText)
  }

  componentWillReceiveProps(nextProps) {
    const searchText = mainSearcher.mainSearchText(this.props.location)
    const nextSearchText = mainSearcher.mainSearchText(nextProps.location)
    if (nextSearchText !== searchText) {
      this.fetchResults(nextSearchText)
    }
  }

  fetchResults = (searchText) => {
    this.props.app.fetchMainSearchResults(searchText)
  }

  toCard = (entity) => {
    const id = `statement-card-${entity.id}`
    return (
      <StatementCard
        id={id}
        key={id}
        className="md-cell md-cell--12"
        statement={entity}
      />
    )
  }

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

export default connect(mapStateToProps, mapActionCreatorGroupToDispatchToProps({
  app,
}))(MainSearchPage)