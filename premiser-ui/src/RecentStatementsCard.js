import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import get from 'lodash/get'
import RecentStatementsListItems from "./RecentStatementsListItems";
import Card from 'react-md/lib/Cards/Card'
import CardText from 'react-md/lib/Cards/CardText'
import CardTitle from 'react-md/lib/Cards/CardTitle'
import CardActions from 'react-md/lib/Cards/CardActions'
import Button from 'react-md/lib/Buttons/Button'
import {statementsSchema} from "./schemas";
import {denormalize} from "normalizr";

import {
  api,
  mapActionCreatorGroupToDispatchToProps,
} from './actions'

class RecentStatementsCard extends Component {

  componentWillMount() {
    if (!this.props.recentStatements) {
      this.props.api.fetchRecentStatements(this.props.widgetId, this.props.fetchCount)
    }
  }

  componentWillReceiveProps(nextProps) {
    const length = this.props.recentStatements ? this.props.recentStatements.length : 0
    const nextLength = nextProps.recentStatements ? nextProps.recentStatements.length : 0
    if (length !== nextLength && this.props.onStatementsLengthChange) {
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
    return (
        <Card>
          <CardTitle title="Recent statements" />
          <CardText>
            {!statements &&
              <div>Loading...</div>
            }
            <RecentStatementsListItems recentStatements={statements || []}/>
          </CardText>
          <CardActions>
            <Button flat label="Fetch more" onClick={this.fetchMoreRecentStatements} />
          </CardActions>
        </Card>
    )
  }
}
RecentStatementsCard.propTypes = {
  widgetId: PropTypes.string.isRequired,
  fetchCount: PropTypes.number.isRequired,
  onStatementsLengthChange: PropTypes.func,
}
RecentStatementsCard.defaultProps = {
  fetchCount: 20,
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