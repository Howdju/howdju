import React, {Component} from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import {schemas} from 'howdju-common'

import {
  api, mapActionCreatorGroupToDispatchToProps
} from "./actions"
import ApiAutocomplete from "./ApiAutocomplete"
import {writSchema} from "./schemas"

class WritTitleAutocomplete extends Component {

  onAutocomplete = (writ) => {
    this.props.onPropertyChange({[this.props.name]: writ.title})
  }

  render() {
    const {
      value,
      suggestionsKey,
      api,
      onKeyDown,
      ...rest
    } = this.props

    return (
      <ApiAutocomplete
        maxLength={schemas.writTitleMaxLength}
        rows={1}
        maxRows={4}
        singleLine={true}
        {...rest}
        value={value}
        onAutocomplete={this.onAutocomplete}
        fetchSuggestions={api.fetchWritTitleSuggestions}
        cancelSuggestions={api.cancelWritTitleSuggestions}
        suggestionsKey={suggestionsKey}
        dataLabel="title"
        dataValue="id"
        suggestionSchema={writSchema}
        onKeyDown={onKeyDown}
      />
    )
  }
}
WritTitleAutocomplete.propTypes = {
  name: PropTypes.string.isRequired,
  /** The value to display in the text input */
  value: PropTypes.string,
  /** Where to store the component's suggestions in the react state (under state.autocompletes.suggestions) */
  suggestionsKey: PropTypes.string.isRequired,
  /** The callback for when a user modifies the value in the text input.  Arguments: (val, event) */
  onPropertyChange: PropTypes.func.isRequired,
  /** Passed to ApiAutocomplete */
  onKeyDown: PropTypes.func,
}

export default connect(null, mapActionCreatorGroupToDispatchToProps({
  api
}))(WritTitleAutocomplete)
