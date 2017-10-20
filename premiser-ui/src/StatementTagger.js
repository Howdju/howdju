import React from 'react'
import {connect} from 'react-redux'
import find from 'lodash/find'

import {
  StatementTagVotePolarity,
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

class StatementTagger extends React.Component {

  onClickTag = (tag) => {
    this.props.goto.tag(tag)
  }

  onTag = (tag) => {
    const statementTagVote = find(this.props.votes, vote => tagEqual(vote.tag, tag))
    this.props.api.tagStatement(this.props.statementId, tag, statementTagVote)
  }

  onAntiTag = (tag) => {
    const statementTagVote = find(this.props.votes, vote => tagEqual(vote.tag, tag))
    this.props.api.antiTagStatement(this.props.statementId, tag, statementTagVote)
  }

  onUnTag = (tag) => {
    const statementTagVote = find(this.props.votes, vote => tagEqual(vote.tag, tag))
    // We can only delete a vote whose ID we have.  We can get here if the user quickly tags and untags
    if (statementTagVote.id) {
      this.props.api.unTagStatement(statementTagVote)
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
      statementId,
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
          POSITIVE: StatementTagVotePolarity.POSITIVE,
          NEGATIVE: StatementTagVotePolarity.NEGATIVE,
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
}))(StatementTagger)
