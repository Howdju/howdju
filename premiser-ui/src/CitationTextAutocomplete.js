import React, {Component} from "react"
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import {
  api, mapActionCreatorGroupToDispatchToProps
} from "./actions";
import ApiAutocomplete from "./ApiAutocomplete";

class CitationTextAutocomplete extends Component {

  constructor() {
    super()

    this.onAutocomplete = this.onAutocomplete.bind(this)
  }

  onAutocomplete(citation) {
    this.props.onPropertyChange({[this.props.name]: citation.text})
  }

  render() {
    const {
      value,
      onPropertyChange,
      suggestionsKey,
      api,
      ...rest
    } = this.props

    return (
        <ApiAutocomplete
            {...rest}
            value={value}
            // maxLength={2048}
            pattern=".+"
            onPropertyChange={onPropertyChange}
            onAutocomplete={this.onAutocomplete}
            fetchSuggestions={api.fetchCitationTextSuggestions}
            suggestionsKey={suggestionsKey}
            dataLabel="text"
            dataValue="id"
            onKeyDown={this.props.onKeyDown}
        />
    )
  }
}
CitationTextAutocomplete.propTypes = {
  name: PropTypes.string.isRequired,
  /** The value to display in the text input */
  value: PropTypes.string,
  /** Where to store the component's suggestions in the react state (under state.autocompletes.suggestions) */
  suggestionsKey: PropTypes.string.isRequired,
  /** The callback for when a user modifies the value in the text input.  Arguments: (val, event) */
  onPropertyChange: PropTypes.func,
  /** Passed to ApiAutocomplete */
  onKeyDown: PropTypes.func,
}

export default connect(null, mapActionCreatorGroupToDispatchToProps({
  api
}))(CitationTextAutocomplete)
