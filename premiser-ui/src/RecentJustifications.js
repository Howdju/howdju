import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Button from 'react-md/lib/Buttons/Button'
import { connect } from 'react-redux'
import concat from 'lodash/concat'
import get from 'lodash/get'
import map from 'lodash/map'
import {justificationsSchema} from "./schemas";
import {denormalize} from "normalizr";
import FlipMove from 'react-flip-move';

import config from './config'


import {
  api,
  ui,
  mapActionCreatorGroupToDispatchToProps,
} from './actions'
import JustificationCard from "./JustificationCard";

class RecentJustifications extends Component {

  componentWillMount() {
    this.props.ui.clearRecentJustifications(this.props.widgetId)
    this.props.api.fetchRecentJustifications(this.props.widgetId, this.props.initialFetchCount || this.props.fetchCount)
  }

  fetchMoreRecentJustifications = event => {
    event.preventDefault()
    this.props.api.fetchRecentJustifications(this.props.widgetId, this.props.fetchCount, this.props.continuationToken)
  }

  render () {
    const {
      justifications,
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
    const hasJustifications = justifications && justifications.length > 0
    const cards = () => map(justifications, j => {
      const id = `recent-statement-${j.id}`
      return <JustificationCard key={id}
                                justification={j}
                                doShowBasisJustifications={false}
                                className="md-cell md-cell--6 md-cell--8-tablet md-cell--4-phone" />
    })
    const fetchMoreButton = <Button flat
                                    key="fetch-more-button"
                                    label="Fetch more"
                                    onClick={this.fetchMoreRecentJustifications}
    />
    const {flipMoveDuration, flipMoveEasing} = config.ui

    return (
        <div>
        <FlipMove {...rest}
                  id="recentJustifications"
                  duration={flipMoveDuration}
                  easing={flipMoveEasing}
        >
          {hasJustifications &&
            concat(cards(), fetchMoreButton)
          }
        </FlipMove>
          <FlipMove>
            {!hasJustifications &&
              <div className="md-cell md-cell--12">No recent justifications.</div>
            }
          </FlipMove>
        </div>

    )
  }
}
RecentJustifications.propTypes = {
  widgetId: PropTypes.string.isRequired,
  fetchCount: PropTypes.number.isRequired,
  /** If defined, the number of statements to fetch the first time */
  initialFetchCount: PropTypes.number,
  onStatementsLengthChange: PropTypes.func,
}
RecentJustifications.defaultProps = {
  initialFetchCount: 7,
  fetchCount: 8,
}
const mapStateToProps = (state, ownProps) => {
  const widgetState = get(state, ['widgets', ownProps.widgetId], {})
  const justifications = denormalize(widgetState.recentJustifications, justificationsSchema, state.entities)
  const {
    continuationToken,
  } = widgetState
  return {
    justifications,
    continuationToken,
  }
}

export default connect(mapStateToProps, mapActionCreatorGroupToDispatchToProps({
  api,
  ui,
}))(RecentJustifications)