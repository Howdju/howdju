import React from 'react'
import {connect} from 'react-redux'
import find from 'lodash/find'

import {
  PropositionTagVotePolarities,
  tagEqual,
} from 'howdju-common'

import {
  combineIds,
  combineSuggestionsKeys,
} from './viewModels'
import {
  api,
  goto,
  mapActionCreatorGroupToDispatchToProps,
} from './actions'

import TagsControl from './TagsControl'

class PropositionTagger extends React.Component {

  onClickTag = (tag) => {
    this.props.goto.tag(tag)
  }

  onTag = (tag) => {
    const propositionTagVote = find(this.props.votes, vote => tagEqual(vote.tag, tag))
    this.props.api.tagProposition(this.props.propositionId, tag, propositionTagVote)
  }

  onAntiTag = (tag) => {
    const propositionTagVote = find(this.props.votes, vote => tagEqual(vote.tag, tag))
    this.props.api.antiTagProposition(this.props.propositionId, tag, propositionTagVote)
  }

  onUnTag = (tag) => {
    const propositionTagVote = find(this.props.votes, vote => tagEqual(vote.tag, tag))
    // We can only delete a vote whose ID we have.  We can get here if the user quickly tags and untags
    if (propositionTagVote.id) {
      this.props.api.unTagProposition(propositionTagVote)
    }
  }

  render() {
    const {
      id,
      tags,
      votes,
      recommendedTags,
      suggestionsKey,
      // ignore
      propositionId,
      ...rest
    } = this.props

    return (
      <TagsControl
        {...rest}
        id={combineIds(id, 'tags')}
        tags={tags}
        votes={votes}
        recommendedTags={recommendedTags}
        extraChildren={[]}
        votePolarity={{
          POSITIVE: PropositionTagVotePolarities.POSITIVE,
          NEGATIVE: PropositionTagVotePolarities.NEGATIVE,
        }}
        suggestionsKey={combineSuggestionsKeys(suggestionsKey, 'tagName')}
        onTag={this.onTag}
        onUnTag={this.onUnTag}
        onAntiTag={this.onAntiTag}
        onClickTag={this.onClickTag}
        inputCollapsable={true}
      />
    )
  }
}

export default connect(null, mapActionCreatorGroupToDispatchToProps({
  api,
  goto,
}))(PropositionTagger)
