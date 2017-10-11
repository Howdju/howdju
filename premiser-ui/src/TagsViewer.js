import React from 'react'
import PropTypes from 'prop-types'
import Button from 'react-md/lib/Buttons/Button'
import cn from 'classnames'
import concat from 'lodash/concat'
import filter from 'lodash/filter'
import find from 'lodash/find'
import get from 'lodash/get'
import map from 'lodash/map'
import sortBy from 'lodash/sortBy'

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
      removable,
      onClickTag,
      onClickAvatar,
      onRemoveTag,
      removeIconName,
    } = this.props
    const {
      doShowAllTags,
    } = this.state

    const unHideableTags = filter(tags, tag => {
      const isRecommended = find(recommendedTags, recommendedTag => tagEqual(recommendedTag, tag))
      const vote = find(votes, vote => tagEqual(vote.tag, tag))
      return get(vote, 'polarity') !== votePolarity.NEGATIVE || isRecommended
    })
    const visibleTags = doShowAllTags ? tags : unHideableTags

    const hasHideableTags = unHideableTags.length < tags.length
    const hideControls = []
    if (hasHideableTags) {
      if (doShowAllTags) {
        hideControls.push(
          <Button
            flat
            key="dont-show-all-button"
            label="Don't show all"
            onClick={() => this.setState({doShowAllTags: false})}
          />
        )
      } else {
        hideControls.push(
          <Button
            flat
            key="show-all-button"
            label="Show all"
            onClick={() => this.setState({doShowAllTags: true})}
          />
        )
      }
    }

    const sortedVisibleTags = sortBy(visibleTags, tag => {
      const vote = find(votes, vote => tagEqual(vote.tag, tag))
      const polarity = get(vote, 'polarity')
      const isRecommended = find(recommendedTags, recommendedTag => tagEqual(recommendedTag, tag))

      if (polarity === votePolarity.POSITIVE) {
        return -2
      }
      if (polarity === votePolarity.NEGATIVE) {
        return 2
      }
      if (isRecommended) {
        return -1
      }
      return 1
    })

    const chips = map(sortedVisibleTags, (tag) => {
      const vote = find(votes, vote => tagEqual(vote.tag, tag))
      const polarity = get(vote, 'polarity')
      return makeChip({
        label: tag.name,
        isAntiVoted: polarity === votePolarity.NEGATIVE,
        className: cn({
          'has-vote': polarity === votePolarity.POSITIVE,
          'has-anti-vote': polarity === votePolarity.NEGATIVE,
        })
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
    })
  }))
}
TagsViewer.defaultProps = {
  tags: []
}