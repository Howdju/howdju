import React, { Component } from 'react'
import PropTypes from 'prop-types'
import CircularProgress from 'react-md/lib/Progress/CircularProgress'
import { connect } from 'react-redux'
import concat from 'lodash/concat'
import get from 'lodash/get'
import map from 'lodash/map'
import {denormalize} from "normalizr";
import FlipMove from 'react-flip-move';

import config from './config'
import FetchButton from './FetchButton'

class ListEntitiesWidget extends Component {

  componentWillMount() {
    this.props.clearEntities(this.props.widgetId)
    const fetchCount = this.props.initialFetchCount || this.props.fetchCount
    this.props.fetchEntities(this.props.widgetId, fetchCount)
  }

  hasEntities = () => {
    const {
      entities
    } = this.props
    return entities && entities.length > 0
  }

  fetchMore = event => {
    event.preventDefault()
    const {
      fetchCount,
      initialFetchCount,
      continuationToken,
      fetchEntities,
      widgetId,
    } = this.props
    const fetchMoreCount = this.hasEntities() ? fetchCount : initialFetchCount
    fetchEntities(widgetId, fetchMoreCount, continuationToken)
  }

  render () {
    const {
      id,
      entities,
      isFetching,
      didError,
      emptyEntitiesMessage,
      loadErrorMessage,
      cellClasses,
      // ignore
      widgetId,
      entitiesWidgetStateKey,
      clearEntities,
      fetchEntities,
      entityToCard,
      entitiesSchema,
      continuationToken,
      initialFetchCount,
      fetchCount,
      // end-ignore
      ...rest,
    } = this.props
    const hasEntities = this.hasEntities()
    const cards = () => map(entities, this.props.entityToCard)
    const fetchMoreButtonCell = <FetchButton flat
                                             className={cellClasses}
                                             key="fetch-more-button"
                                             progressId={`${id}-fetch-more-button-progress`}
                                             label="Fetch more"
                                             onClick={this.fetchMore}
                                             disabled={isFetching}
                                             isFetching={isFetching}
    />
    const retryButtonCell = <FetchButton flat
                                         className={cellClasses}
                                         key="retry-button"
                                         progressId={`${id}-retry-button-progress`}
                                         label="Retry"
                                         disabled={isFetching}
                                         isFetching={isFetching}
                                         onClick={this.fetchMore}
    />
    const {flipMoveDuration, flipMoveEasing} = config.ui

    return (
        <div id={id}>
          <FlipMove {...rest}
                    duration={flipMoveDuration}
                    easing={flipMoveEasing}
          >
            {hasEntities && concat(cards(), fetchMoreButtonCell)}
            {!hasEntities && !isFetching &&
              <div className="md-cell md-cell--12">{emptyEntitiesMessage}</div>
            }
            {!hasEntities && !didError && isFetching &&
              <CircularProgress key="progress" id={`${id}-progress`} className="md-cell md-cell--12" />
            }
            {didError && <span className="error-message">{loadErrorMessage}</span>}
            {didError && !hasEntities && retryButtonCell}
          </FlipMove>
        </div>
    )
  }
}
ListEntitiesWidget.propTypes = {
  /** Used to calculate IDs required for accessibility */
  id: PropTypes.string.isRequired,
  /** The state.widgets key where the entities are stored */
  widgetId: PropTypes.string.isRequired,
  entitiesWidgetStateKey: PropTypes.string.isRequired,
  clearEntities: PropTypes.func.isRequired,
  fetchEntities: PropTypes.func.isRequired,
  /** The number of entities to fetch after the first fetch */
  fetchCount: PropTypes.number.isRequired,
  /** The number of entities to fetch the first time. */
  initialFetchCount: PropTypes.number,
  /** Applied to each of the entities to display them */
  entityToCard: PropTypes.func.isRequired,
  /** The schema with which to denormalize the entities returned by {@see entitiesWidgetStateKey} */
  entitiesSchema: PropTypes.oneOfType([
      PropTypes.object,
      PropTypes.arrayOf(PropTypes.object),
  ]).isRequired,
  /** The message to display when there are no entities */
  emptyEntitiesMessage: PropTypes.string.isRequired,
  loadErrorMessage: PropTypes.string.isRequired,
  /** The classes to use for the fetch buttons that take up the space of a cell */
  cellClasses: PropTypes.string,
}
ListEntitiesWidget.smallCellClasses = "md-cell md-cell--3 md-cell--8-tablet md-cell--4-phone"
ListEntitiesWidget.largeCellClasses = "md-cell md-cell--6 md-cell--8-tablet md-cell--4-phone"
ListEntitiesWidget.defaultProps = {
  // This way the fetchMoreButton takes up the last column
  initialFetchCount: 7,
  fetchCount: 8,
  cellClasses: ListEntitiesWidget.smallCellClasses,
}
const mapStateToProps = (state, ownProps) => {
  const widgetState = get(state, ['widgets', 'listEntities', ownProps.widgetId], {})
  const {
    continuationToken,
    isFetching,
    didError,
  } = widgetState
  const normalEntities = get(widgetState, ownProps.entitiesWidgetStateKey)
  const entities = denormalize(normalEntities, ownProps.entitiesSchema, state.entities)
  return {
    entities,
    continuationToken,
    isFetching,
    didError,
  }
}

const mapDispatchToProps = (dispatch, ownProps) => ({
  clearEntities: (widgetId) => dispatch(ownProps.clearEntities(widgetId)),
  fetchEntities: (widgetId, fetchCount, continuationToken) => dispatch(ownProps.fetchEntities(widgetId, fetchCount, continuationToken)),
})

export default connect(mapStateToProps, mapDispatchToProps)(ListEntitiesWidget)