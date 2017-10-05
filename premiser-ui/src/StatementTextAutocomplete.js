import React, {Component} from "react"
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import {
  api, mapActionCreatorGroupToDispatchToProps
} from "./actions"
import ApiAutocomplete from "./ApiAutocomplete"
import {statementSchema} from "./schemas"

class StatementTextAutocomplete extends Component {

  onAutocomplete = (statement) => {
    this.props.onPropertyChange({[this.props.name]: statement.text})
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
        maxLength={2048}
        rows={1}
        maxRows={4}
        singleLine={true}
        onAutocomplete={this.onAutocomplete}
        fetchSuggestions={api.fetchStatementTextSuggestions}
        cancelSuggestions={api.cancelStatementTextSuggestions}
        suggestionsKey={suggestionsKey}
        dataLabel="text"
        dataValue="id"
        suggestionSchema={statementSchema}
      />
    )
  }
}
StatementTextAutocomplete.propTypes = {
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
}))(StatementTextAutocomplete)
