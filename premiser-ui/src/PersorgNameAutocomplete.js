import React, {Component} from "react"
import PropTypes from 'prop-types'

import ApiAutocomplete from "./ApiAutocomplete"
import {persorgSchema} from './normalizationSchemas'


export default class PersorgNameAutocomplete extends Component {

  onAutocomplete = (persorg) => {
    if (this.props.onAutocomplete) {
      this.props.onAutocomplete(persorg)
    }
    this.props.onPropertyChange({[this.props.name]: persorg.name})
  }

  static propTypes = {
    name: PropTypes.string.isRequired,
    /** The value to display in the text input */
    value: PropTypes.string,
    /** Where to store the component's suggestions in the react state (under state.autocompletes.suggestions) */
    suggestionsKey: PropTypes.string.isRequired,
    /** The callback for when a user modifies the value in the text input.  Arguments: (val, event) */
    onPropertyChange: PropTypes.func.isRequired,
    /** If present, called with the persorg when an autocomplete occurs */
    onAutocomplete: PropTypes.func,
    onKeyDown: PropTypes.func,
  }

  render() {
    const {
      suggestionsKey,
      api,
      ...rest
    } = this.props

    return (
      <ApiAutocomplete
        {...rest}
        rows={1}
        maxRows={4}
        singleLine={true}
        onAutocomplete={this.onAutocomplete}
        suggestionSchema={persorgSchema}
        fetchSuggestions={api.fetchPersorgNameSuggestions}
        cancelSuggestions={api.cancelPersorgNameSuggestions}
        suggestionsKey={suggestionsKey}
        dataLabel="name"
        dataValue="id"
      />
    )
  }
}
