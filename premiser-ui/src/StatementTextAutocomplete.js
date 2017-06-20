import React, {Component} from "react"
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import {
  api, mapActionCreatorGroupToDispatchToProps
} from "./actions";
import ApiAutocomplete from "./ApiAutocomplete";

class StatementTextAutocomplete extends Component {

  constructor() {
    super()

    this.onAutocomplete = this.onAutocomplete.bind(this)
  }

  onAutocomplete(statement) {
    this.props.onPropertyChange({[this.props.name]: statement.text})
  }

  render() {
    const {
      value,
      onPropertyChange,
      suggestionsKey,
      api,
      onKeyDown,
      ...props
    } = this.props

    return (
      <ApiAutocomplete
          {...props}
          value={value}
          // maxLength={2048}
          pattern=".+"
          onPropertyChange={onPropertyChange}
          onAutocomplete={this.onAutocomplete}
          fetchSuggestions={api.fetchStatementTextSuggestions}
          suggestionsKey={suggestionsKey}
          dataLabel="text"
          dataValue="id"
          onKeyDown={onKeyDown}
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
  onPropertyChange: PropTypes.func,
  onKeyDown: PropTypes.func,
}

export default connect(null, mapActionCreatorGroupToDispatchToProps({
  api
}))(StatementTextAutocomplete)
