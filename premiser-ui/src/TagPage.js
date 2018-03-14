import get from 'lodash/get'
import isEqual from 'lodash/isEqual'
import map from 'lodash/map'
import React from 'react'
import {CircularProgress} from 'react-md'
import {connect} from 'react-redux'

import {
  api,
  ui,
  mapActionCreatorGroupToDispatchToProps,
} from "./actions"
import StatementCard from './StatementCard'
import {denormalize} from 'normalizr'
import {statementsSchema, tagSchema} from './schemas'
import * as characters from './characters'


class TagPage extends React.Component {

  componentDidMount() {
    const tagId = getTagId(this.props)
    this.refreshResults(tagId)
  }

  componentWillReceiveProps(nextProps) {
    const tagId = getTagId(this.props)
    const nextTagId = getTagId(nextProps)
    if (!isEqual(tagId, nextTagId)) {
      this.refreshResults(nextTagId)
    }
  }

  refreshResults = (tagId) => {
    this.props.api.fetchTag(tagId)
    this.props.api.fetchTaggedStatements(tagId)
  }

  render() {
    const {
      tag,
      statements,
      isFetching
    } = this.props

    const tagName = get(tag, 'name', characters.ellipsis)

    return (
      <div className="md-grid">
        <div className="md-cell--12">
          <h1>Statements tagged with &ldquo;{tagName}&rdquo;</h1>
        </div>
        {map(statements, statement => {
          const id = `statement-card-${statement.id}`
          return (
            <StatementCard
              statement={statement}
              id={id}
              key={id}
              className="md-cell--12"
            />
          )
        })}
        {!isFetching && statements.length < 1 && (
          <div className="md-cell--12">No tagged statements</div>
        )}
        {isFetching && (
          <div className="md-cell md-cell--12 cell--centered-contents">
            <CircularProgress id="tagged-statements-page--progress" />
          </div>
        )}
      </div>
    )
  }
}

function getTagId(props) {
  return props.match.params.tagId
}

function mapStateToProps(state, ownProps) {
  const tagId = getTagId(ownProps)
  const tag = denormalize(state.entities.tags[tagId], tagSchema, state.entities)
  const {statements: statementIds, isFetching} = state.ui.tagPage
  const statements = denormalize(statementIds, statementsSchema, state.entities)
  return {
    tag,
    statements,
    isFetching,
  }
}

export default connect(mapStateToProps, mapActionCreatorGroupToDispatchToProps({
  api,
  ui,
}))(TagPage)
