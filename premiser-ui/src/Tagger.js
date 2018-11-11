import React from 'react'
import {connect} from 'react-redux'
import find from 'lodash/find'

import {
  PropositionTagVotePolarity,
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

class Tagger extends React.Component {

  onClickTag = (tag) => {
    this.props.goto.tag(tag)
  }

  findTagVote = (tag) => {
    return find(this.props.target.votes, vote => tagEqual(vote.tag, tag))
  }

  onTag = (tag) => {
    const tagVote = this.findTagVote(tag)
    this.props.api.createTag(this.props.targetType, this.props.target.id, tag, tagVote)
  }

  onAntiTag = (tag) => {
    const tagVote = this.findTagVote(tag)
    this.props.api.createAntiTag(this.props.targetType, this.props.target.id, tag, tagVote)
  }

  onUnTag = (tag) => {
    const tagVote = this.findTagVote(tag)
    // We can only delete a vote whose ID we have.  We might be untagging a vote lacking an ID if the user quickly tags/untags
    if (tagVote.id) {
      this.props.api.unTag(tagVote)
    }
  }

  render() {
    const {
      target: {
        tags,
        tagVotes,
        recommendedTags,
      },
      id,
      suggestionsKey,
      // ignore
      targetType,
      ...rest
    } = this.props

    return (
      <TagsControl
        {...rest}
        id={combineIds(id, 'tags')}
        tags={tags}
        votes={tagVotes}
        recommendedTags={recommendedTags}
        extraChildren={[]}
        votePolarity={{
          POSITIVE: PropositionTagVotePolarity.POSITIVE,
          NEGATIVE: PropositionTagVotePolarity.NEGATIVE,
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
}))(Tagger)
