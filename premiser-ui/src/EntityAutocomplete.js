import React, {Component} from "react"
import PropTypes from 'prop-types'

import ApiAutocomplete from "./ApiAutocomplete"
import {propositionSchema} from "./schemas"
import config from './config'


export default class EntityAutocomplete extends Component {

  onAutocomplete = (proposition) => {
    this.props.onPropertyChange({[this.props.name]: proposition.text})
  }

  static propTypes = {
    name: PropTypes.string.isRequired,
    /** The value to display in the text input */
    value: PropTypes.string,
    /** Where to store the component's suggestions in the react state (under state.autocompletes.suggestions) */
    suggestionsKey: PropTypes.string.isRequired,
    /** The callback for when a user modifies the value in the text input.  Arguments: (val, event) */
    onPropertyChange: PropTypes.func.isRequired,
    onKeyDown: PropTypes.func,
    suggestionFetcher: PropTypes.func.isRequired,
    suggestionFetchCanceler: PropTypes.func.isRequired,
  }

  render() {
    const {
      suggestionsKey,
      suggestionFetcher,
      suggestionFetchCanceler,
      ...rest
    } = this.props

    return (
      <ApiAutocomplete
        {...rest}
        rows={1}
        maxRows={4}
        singleLine={true}
        onAutocomplete={this.onAutocomplete}
        fetchSuggestions={suggestionFetcher}
        cancelSuggestions={suggestionFetchCanceler}
        suggestionsKey={suggestionsKey}
        dataLabel="text"
        dataValue="id"
        suggestionSchema={propositionSchema}
      />
    )
  }
}
