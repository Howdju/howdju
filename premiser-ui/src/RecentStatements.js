import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Button from 'react-md/lib/Buttons/Button'
import { connect } from 'react-redux'
import concat from 'lodash/concat'
import get from 'lodash/get'
import map from 'lodash/map'
import {statementsSchema} from "./schemas";
import {denormalize} from "normalizr";
import FlipMove from 'react-flip-move';

import config from './config'

import StatementCard from './StatementCard'

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
    this.props.api.fetchMoreRecentStatements(this.props.widgetId, this.props.continuationToken, this.props.fetchCount)
  }

  render () {
    const {
      statements,
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
    const cards = () => map(statements, s => {
      const id = `recent-statement-${s.id}`
      return <StatementCard key={id} statement={s} className="md-cell md-cell--3 md-cell--4-tablet" />
    })
    const fetchMoreButton = <Button flat
                                    key="fetch-more-button"
                                    label="Fetch more"
                                    onClick={this.fetchMoreRecentStatements}
    />
    const {flipMoveDuration, flipMoveEasing} = config.ui.statementJustifications

    return (
        <FlipMove {...rest}
                  id="recentStatements"
                  duration={flipMoveDuration}
                  easing={flipMoveEasing}
        >
          {statements && statements.length > 0 ?
              concat(cards(), fetchMoreButton) :
              <div>No recent statements.</div>
          }
        </FlipMove>
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
  const statements = denormalize(widgetState.recentStatements, statementsSchema, state.entities)
  const {
    continuationToken,
  } = widgetState
  return {
    statements,
    continuationToken,
  }
}

export default connect(mapStateToProps, mapActionCreatorGroupToDispatchToProps({
  api,
  ui,
}))(RecentStatements)