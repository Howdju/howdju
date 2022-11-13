import React, {Component} from "react"
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import {schemaSettings} from 'howdju-common'

import {
  api, mapActionCreatorGroupToDispatchToProps,
} from "./actions"
import ApiAutocomplete from "./ApiAutocomplete"
import {propositionSchema} from "./normalizationSchemas"
import { cancelPropositionTextSuggestions } from "./apiActions"


class PropositionTextAutocomplete extends Component {

  onAutocomplete = (proposition) => {
    this.props.onPropertyChange({[this.props.name]: proposition.text})
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
        maxLength={schemaSettings.propositionTextMaxLength}
        rows={1}
        maxRows={4}
        singleLine={true}
        onAutocomplete={this.onAutocomplete}
        fetchSuggestions={api.fetchPropositionTextSuggestions}
        cancelSuggestions={cancelPropositionTextSuggestions}
        suggestionsKey={suggestionsKey}
        dataLabel="text"
        dataValue="id"
        suggestionSchema={propositionSchema}
      />
    )
  }
}
PropositionTextAutocomplete.propTypes = {
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
  api,
}))(PropositionTextAutocomplete)
