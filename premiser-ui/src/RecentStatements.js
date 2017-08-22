import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Button from 'react-md/lib/Buttons/Button'
import CircularProgress from 'react-md/lib/Progress/CircularProgress'
import { connect } from 'react-redux'
import concat from 'lodash/concat'
import get from 'lodash/get'
import map from 'lodash/map'
import {statementsSchema} from "./schemas";
import {denormalize} from "normalizr";
import FlipMove from 'react-flip-move';

import config from './config'
import StatementCard from './StatementCard'
import FetchButton from './FetchButton'

import {
  api,
  ui,
  mapActionCreatorGroupToDispatchToProps,
} from './actions'

class RecentStatements extends Component {

  componentWillMount() {
    this.props.ui.clearRecentStatements(this.props.widgetId)
    this.props.api.fetchRecentStatements(this.props.widgetId, this.props.initialFetchCount || this.props.fetchCount)
  }

  fetchMoreRecentStatements = event => {
    event.preventDefault()
    const {
      statements
    } = this.props
    const fetchCount = statements && statements.length > 0 ? this.props.fetchCount : this.props.initialFetchCount
    this.props.api.fetchRecentStatements(this.props.widgetId, fetchCount, this.props.continuationToken)
  }

  render () {
    const {
      statements,
      isFetching,
      didError,
      // ignore
      widgetId,
      continuationToken,
      api,
      ui,
      initialFetchCount,
      fetchCount,
      // end-ignore
      ...rest,
    } = this.props
    const cellClasses = "md-cell md-cell--3 md-cell--8-tablet md-cell--4-phone"
    const hasStatements = statements && statements.length > 0
    const cards = () => map(statements, s => {
      const id = `recent-statement-${s.id}`
      return <StatementCard key={id} statement={s} className={cellClasses} />
    })
    const fetchMoreButtonCell = <FetchButton flat
                                             className={cellClasses}
                                             key="fetch-more-button"
                                             progressId="fetch-more-button-progress"
                                             label="Fetch more"
                                             onClick={this.fetchMoreRecentStatements}
                                             disabled={isFetching}
                                             isFetching={isFetching}
    />
    const retryButtonCell = <FetchButton flat
                                         className={cellClasses}
                                         key="retry-button"
                                         progressId="retry-button-progress"
                                         label="Retry"
                                         disabled={isFetching}
                                         isFetching={isFetching}
                                         onClick={this.fetchMoreRecentStatements}
    />
    const {flipMoveDuration, flipMoveEasing} = config.ui

    return (
        <div>
          <FlipMove {...rest}
                    id="recentStatements"
                    duration={flipMoveDuration}
                    easing={flipMoveEasing}
          >
            {hasStatements && concat(cards(), fetchMoreButtonCell)}
          </FlipMove>
          <FlipMove duration={flipMoveDuration}
                    easing={flipMoveEasing}
          >
            {!hasStatements && !isFetching &&
              <div className="md-cell md-cell--12">No recent statements.</div>
            }
          </FlipMove>
          <FlipMove duration={flipMoveDuration}
                    easing={flipMoveEasing}
          >
            {!hasStatements && !didError && isFetching &&
              <CircularProgress key="progress" id="recent-statements-progress" className="md-cell md-cell--12" />
            }
          </FlipMove>
          {didError && <span className="error-message">There was an error fetching the recent statements.</span>}
          {didError && !hasStatements && retryButtonCell}
        </div>
    )
  }
}
RecentStatements.propTypes = {
  widgetId: PropTypes.string.isRequired,
  fetchCount: PropTypes.number.isRequired,
  /** If defined, the number of statements to fetch the first time */
  initialFetchCount: PropTypes.number,
  onStatementsLengthChange: PropTypes.func,
}
RecentStatements.defaultProps = {
  initialFetchCount: 7,
  fetchCount: 8,
}
const mapStateToProps = (state, ownProps) => {
  const widgetState = get(state, ['widgets', ownProps.widgetId], {})
  const {
    recentStatements,
    continuationToken,
    isFetching,
    didError,
  } = widgetState
  const statements = denormalize(recentStatements, statementsSchema, state.entities)
  return {
    statements,
    continuationToken,
    isFetching,
    didError,
  }
}

export default connect(mapStateToProps, mapActionCreatorGroupToDispatchToProps({
  api,
  ui,
}))(RecentStatements)