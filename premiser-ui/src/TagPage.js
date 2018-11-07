import Helmet from 'react-helmet'
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
import PropositionCard from './PropositionCard'
import {denormalize} from 'normalizr'
import {propositionsSchema, tagSchema} from './schemas'
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
    this.props.api.fetchTaggedPropositions(tagId)
  }

  render() {
    const {
      tag,
      propositions,
      isFetching
    } = this.props

    const tagName = get(tag, 'name', characters.ellipsis)
    const title = `Propositions tagged with “${tagName}”`

    return (
      <div id="tag-page" className="md-grid">
        <Helmet>
          <title>{title} — Howdju</title>
        </Helmet>
        <div className="md-cell--12">
          <h1>{title}</h1>
        </div>
        {map(propositions, proposition => {
          const id = `proposition-card-${proposition.id}`
          return (
            <PropositionCard
              proposition={proposition}
              id={id}
              key={id}
              className="md-cell--12"
            />
          )
        })}
        {!isFetching && propositions.length < 1 && (
          <div className="md-cell--12">No tagged propositions</div>
        )}
        {isFetching && (
          <div className="md-cell md-cell--12 cell--centered-contents">
            <CircularProgress id="tagged-propositions-page--progress" />
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
  const {propositions: propositionIds, isFetching} = state.ui.tagPage
  const propositions = denormalize(propositionIds, propositionsSchema, state.entities)
  return {
    tag,
    propositions,
    isFetching,
  }
}

export default connect(mapStateToProps, mapActionCreatorGroupToDispatchToProps({
  api,
  ui,
}))(TagPage)
