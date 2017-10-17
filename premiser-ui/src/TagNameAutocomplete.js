import React, {Component} from "react"
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import {
  api, mapActionCreatorGroupToDispatchToProps
} from "./actions"
import ApiAutocomplete from "./ApiAutocomplete"
import {tagSchema} from "./schemas"
import config from './config'


class TagNameAutocomplete extends Component {

  onAutocomplete = (tag) => {
    this.props.onPropertyChange({[this.props.name]: tag.name})
    if (this.props.onAutocomplete) {
      this.props.onAutocomplete(tag)
    }
  }

  render() {
    const {
      id,
      name,
      suggestionsKey,
      api,
      onPropertyChange,
      onKeyDown,
      focusInputOnAutocomplete,
      ...rest
    } = this.props

    return (
      <ApiAutocomplete
        maxLength={config.ui.tagNameMaxLength}
        rows={1}
        maxRows={1}
        singleLine={true}
        label="Tag"
        {...rest}
        id={id}
        fetchSuggestions={api.fetchTagNameSuggestions}
        cancelSuggestions={api.cancelTagNameSuggestions}
        suggestionsKey={suggestionsKey}
        suggestionSchema={tagSchema}
        name={name}
        dataLabel="name"
        dataValue="id"
        focusInputOnAutocomplete={focusInputOnAutocomplete}
        onAutocomplete={this.onAutocomplete}
        onKeyDown={onKeyDown}
        onPropertyChange={onPropertyChange}
      />
    )
  }
}
TagNameAutocomplete.propTypes = {
  name: PropTypes.string.isRequired,
  /** The value to display in the text input */
  value: PropTypes.string,
  /** Where to store the component's suggestions in the react state (under state.autocompletes.suggestions) */
  suggestionsKey: PropTypes.string.isRequired,
  /** The callback for when a user modifies the value in the text input.  Arguments: (val, event) */
  onPropertyChange: PropTypes.func.isRequired,
  onKeyDown: PropTypes.func,
}

export default connect(null, mapActionCreatorGroupToDispatchToProps({
  api
}))(TagNameAutocomplete)
