import React from 'react'
import PropTypes from 'prop-types'
import {Button} from 'react-md'
import cn from 'classnames'
import concat from 'lodash/concat'
import filter from 'lodash/filter'
import find from 'lodash/find'
import get from 'lodash/get'
import map from 'lodash/map'
import sortBy from 'lodash/sortBy'
import zipObject from 'lodash/zipObject'

import {
  tagEqual,
} from 'howdju-common'

import {
  makeChip,
} from './viewModels'
import ChipsList from './ChipsList'

import './TagsViewer.scss'


export default class TagsViewer extends React.Component {

  constructor() {
    super()

    this.state = {
      doShowAllTags: false,
    }
  }

  render() {
    const {
      tags,
      votes,
      recommendedTags,
      votePolarity,
      extraChildren,
      votable,
      removable,
      onClickTag,
      onClickAvatar,
      onRemoveTag,
      removeIconName,
      canHide,
    } = this.props
    const {
      doShowAllTags,
    } = this.state

    const voteByTagName = zipObject(map(votes, vote => vote.tag.name), votes)

    const alwaysVisibleTags = filter(tags, tag => {
      const isRecommended = find(recommendedTags, recommendedTag => tagEqual(recommendedTag, tag))
      const vote = voteByTagName[tag.name]
      const polarity = get(vote, 'polarity')
      const isVoted = polarity === votePolarity.POSITIVE
      const isAntiVoted = polarity === votePolarity.NEGATIVE
      return isVoted || isRecommended && !isAntiVoted
    })
    const visibleTags = !canHide || doShowAllTags ? tags : alwaysVisibleTags

    const hasHideableTags = alwaysVisibleTags.length < tags.length
    const hideControls = []
    if (canHide && hasHideableTags) {
      if (doShowAllTags) {
        hideControls.push(
          <Button
            flat
            key="dont-show-all-button"
            children="Don't show all"
            onClick={() => this.setState({doShowAllTags: false})}
          />
        )
      } else {
        hideControls.push(
          <Button
            flat
            key="show-all-button"
            children="Show all"
            onClick={() => this.setState({doShowAllTags: true})}
          />
        )
      }
    }

    const sortedVisibleTags = sortBy(visibleTags, (tag) => {
      const vote = voteByTagName[tag.name]
      const polarity = get(vote, 'polarity')
      const isVoted = polarity && polarity === votePolarity.POSITIVE
      const isAntiVoted = polarity && polarity === votePolarity.NEGATIVE
      const isRecommended = find(recommendedTags, recommendedTag => tagEqual(recommendedTag, tag))

      if (isVoted) {
        return -2
      }
      if (isAntiVoted) {
        return 2
      }
      if (isRecommended) {
        return -1
      }
      return 1
    })

    const chips = map(sortedVisibleTags, (tag) => {
      const vote = voteByTagName[tag.name]
      const polarity = get(vote, 'polarity')
      const isVoted = polarity && polarity === votePolarity.POSITIVE
      const isAntiVoted = polarity && polarity === votePolarity.NEGATIVE
      return makeChip({
        label: tag.name,
        isAntiVoted,
        className: cn({
          'has-vote': isVoted,
          'has-anti-vote': isAntiVoted,
        }),
      })
    })

    const extraChipListChildren = concat(hideControls, extraChildren)

    return (
      <ChipsList
        chips={chips}
        extraChildren={extraChipListChildren}
        removable={removable}
        onClickChip={onClickTag}
        onClickAvatar={onClickAvatar}
        onRemoveChip={onRemoveTag}
        removeIconName={removeIconName}
        showAvatars={votable}
      />
    )
  }
}
TagsViewer.propTypes = {
  tags: PropTypes.arrayOf(PropTypes.shape({
    // Newly created tags may not have an ID
    id: PropTypes.string,
    name: PropTypes.string.isRequired,
    vote: PropTypes.shape({
      polarity: PropTypes.string,
    }),
  })),
}
TagsViewer.defaultProps = {
  tags: [],
  removable: false,
  votePolarity: {},
  canHide: true,
  votable: true,
}