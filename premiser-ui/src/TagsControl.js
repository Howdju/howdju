import React from 'react'
import PropTypes from 'prop-types'
import find from 'lodash/find'
import get from 'lodash/get'
import includes from 'lodash/includes'
import Button from 'react-md/lib/Buttons/Button'

import {
  makeTag,
  cleanWhitespace,
  tagEqual,
} from 'howdju-common'

import {
  combineIds,
} from './viewModels'
import TagNameAutocomplete from './TagNameAutocomplete'
import TagsViewer from './TagsViewer'
import {Keys} from './keyCodes'

import './TagsControl.scss'


export default class TagsControl extends React.Component {

  constructor() {
    super()

    this.state = {
      tagName: '',
      isInputCollapsed: true,
    }
  }

  onTagNameKeyDown = (event) => {
    const {
      inputCollapsable,
    } = this.props
    const {
      tagName,
    } = this.state

    if (!tagName && event.key === Keys.ENTER && this.props.onSubmit) {
      this.props.onSubmit(event)

      if (event.isDefaultPrevented()) {
        return
      }
    }

    if (includes(this.props.commitChipKeys, event.key)) {
      event.preventDefault()

      if (tagName) {
        this.addTag(tagName, event)
        this.setState({tagName: ''})

        if (this.props.cancelSuggestions) {
          this.props.cancelSuggestions()
        }
      }
    }

    if (inputCollapsable && event.key === Keys.ENTER) {
      this.setState({isInputCollapsed: true})
    }
  }

  onTagNamePropertyChange = (properties) => {
    this.setState({tagName: properties.tagName})
  }

  onTagNameAutocomplete = (tag) => {
    this.props.onTag(tag)
    this.setState({tagName: ''})
  }

  onClickTag = (tagName, index, event) => {
    if (this.props.onClickTag) {
      const tag = find(this.props.tags, tag => tag.name === tagName)
      this.props.onClickTag(tag)
    }
  }

  onClickAvatar = (tagName, index, event) => {
    const tag = find(this.props.tags, tag => tag.name === tagName)
    const vote = find(this.props.votes, vote => tagEqual(vote.tag, tag))

    const votePolarity = get(vote, 'polarity')
    if (votePolarity === this.props.votePolarity.POSITIVE) {
      this.props.onUnTag(tag)
    } else {
      this.props.onTag(tag)
    }
  }

  onRemoveTag = (tagName, index, event) => {
    const tag = find(this.props.tags, tag => tag.name === tagName)

    const vote = find(this.props.votes, vote => tagEqual(vote.tag, tag))
    const votePolarity = get(vote, 'polarity')
    if (votePolarity === this.props.votePolarity.NEGATIVE) {
      this.props.onUnTag(tag)
    } else {
      // Only anti-tag existing tags on existing targets (the point of anti-tagging is to vote against tags recommended
      //  by the system; the system can't recommend tags for targets/tags that don't exist.
      if (this.props.onAntiTag && tag.id) {
        this.props.onAntiTag(tag)
      }
    }
  }

  addTag = (tagName, event) => {
    const cleanTagName = cleanWhitespace(tagName)
    const tag = makeTag({name: cleanTagName})
    this.props.onTag(tag)
  }

  closeInput = (event) => {
    const {
      tagName
    } = this.state

    if (tagName) {
      this.addTag(tagName, event)
    }
    this.setState({
      tagName: '',
      isInputCollapsed: true,
    })
  }

  render() {
    const {
      tags,
      votes,
      recommendedTags,
      id,
      suggestionsKey,
      votePolarity,
      inputCollapsable,
      onSubmit,
      // ignore
      onTag,
      onUntag,
      onAntiTag,
      addTitle,
      ...rest
    } = this.props
    const {
      tagName,
      isInputCollapsed,
    } = this.state

    const tagNameAutocompleteId = combineIds(id, 'tag-name')
    const extraChildren = []
    if (!inputCollapsable || !isInputCollapsed) {
      extraChildren.push(
        <TagNameAutocomplete
          id={tagNameAutocompleteId}
          key={tagNameAutocompleteId}
          name="tagName"
          value={tagName}
          className="tag-name-autocomplete"
          suggestionsKey={suggestionsKey}
          focusInputOnAutocomplete={true}
          onAutocomplete={this.onTagNameAutocomplete}
          onPropertyChange={this.onTagNamePropertyChange}
          onKeyDown={this.onTagNameKeyDown}
          rightIcon={
            inputCollapsable ? (
              <Button
                icon
                onClick={event => this.closeInput(event)}
              >done</Button>
            ) : null
          }
          onSubmit={onSubmit}
        />
      )
    }
    if (inputCollapsable && isInputCollapsed) {
      extraChildren.push(
        <Button
          icon
          onClick={event => this.setState({isInputCollapsed: false})}
          title={addTitle}
          key="show-input"
        >add</Button>
      )
    }

    const removeIconName = onAntiTag ? 'thumb_down' : 'clear'

    return (
      <TagsViewer
        removable={true}
        {...rest}
        tags={tags}
        votes={votes}
        recommendedTags={recommendedTags}
        votePolarity={votePolarity}
        extraChildren={extraChildren}
        onClickTag={this.onClickTag}
        onClickAvatar={this.onClickAvatar}
        onRemoveTag={this.onRemoveTag}
        removeIconName={removeIconName}
      />
    )
  }
}
TagsControl.propTypes = {
  commitChipKeys: PropTypes.arrayOf(PropTypes.string),
  onClickTag: PropTypes.func,
  onTag: PropTypes.func.isRequired,
  onUnTag: PropTypes.func.isRequired,
  onAntiTag: PropTypes.func,
  /** Enable collapsing the tag name input */
  inputCollapsable: PropTypes.bool,
}
TagsControl.defaultProps = {
  commitChipKeys: [Keys.ENTER, Keys.COMMA],
  inputCollapsable: false,
  addTitle: 'Add tag',
}
