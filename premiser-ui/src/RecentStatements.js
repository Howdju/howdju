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

import RecentStatementCard from './RecentStatementCard'

import {
  api,
  mapActionCreatorGroupToDispatchToProps,
} from './actions'

class RecentStatementsCard extends Component {

  componentWillMount() {
    if (!this.props.recentStatements) {
      this.props.api.fetchRecentStatements(this.props.widgetId, this.props.initialFetchCount || this.props.fetchCount)
    }
  }

  componentWillReceiveProps(nextProps) {
    const length = this.props.statements ? this.props.statements.length : 0
    const nextLength = nextProps.statements ? nextProps.statements.length : 0
    if (length !== nextLength && this.props.onStatementsLengthChange) {
      console.log('onStatementsLengthChange')
      this.props.onStatementsLengthChange()
    }
  }

  fetchMoreRecentStatements = event => {
    event.preventDefault()
    this.props.api.fetchMoreRecentStatements(this.props.widgetId, this.props.continuationToken, this.props.fetchCount)
  }

  render () {
    const {
      statements,
    } = this.props
    const cards = () => map(statements, s => {
      const id = `recent-statement-${s.id}`
      return <RecentStatementCard key={id} statement={s} />
    })
    const fetchMoreButton = <Button flat
                                    key="fetch-more-button"
                                    label="Fetch more"
                                    onClick={this.fetchMoreRecentStatements}
    />
    const {flipMoveDuration, flipMoveEasing} = config.ui.statementJustifications

    return (
        <FlipMove id="recentStatements"
                  duration={flipMoveDuration}
                  easing={flipMoveEasing}
                  className="md-grid"
        >
          {statements && statements.length > 0 ?
              concat(cards(), fetchMoreButton) :
              <div>No recent statements.</div>
          }
        </FlipMove>
    )
  }
}
RecentStatementsCard.propTypes = {
  widgetId: PropTypes.string.isRequired,
  fetchCount: PropTypes.number.isRequired,
  /** If defined, the number of statements to fetch the first time */
  initialFetchCount: PropTypes.number,
  onStatementsLengthChange: PropTypes.func,
}
RecentStatementsCard.defaultProps = {
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
}))(RecentStatementsCard)