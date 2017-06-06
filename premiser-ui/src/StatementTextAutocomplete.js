import React, {Component} from "react"
import PropTypes from 'prop-types'
import throttle from 'lodash/throttle'
import Autocomplete from 'react-md/lib/Autocompletes'
import { connect } from 'react-redux'
import {denormalize} from "normalizr";

import {
  ESCAPE_KEY_CODE
} from './keyCodes'
import autocompleter from './autocompleter'
import {
  api, mapActionCreatorGroupToDispatchToProps
} from "./actions";
import {statementSchema} from "./schemas";

class StatementTextAutocomplete extends Component {

  constructor() {
    super()

    this.onChange = this.onChange.bind(this)
    this.onAutocomplete = this.onAutocomplete.bind(this)
    this.onKeyDown = this.onKeyDown.bind(this)
    this.refreshAutocomplete = throttle(this.refreshAutocomplete.bind(this), 1000)
  }

  componentWillReceiveProps(nextProps) {
    autocompleter.fixOpen(this.autocomplete, nextProps.value, nextProps.suggestedStatements)
  }

  onChange(val, e) {
    const name = e.target.name
    this.props.onPropertyChange({[name]: val})
    this.refreshAutocomplete(val)
  }

  onKeyDown(e) {
    if (e.keyCode === ESCAPE_KEY_CODE) {
      e.preventDefault()
      if (this.autocomplete.state.isOpen) {
        this.autocomplete._close()
      }
    }
  }

  refreshAutocomplete(text) {
    this.props.api.fetchStatementSuggestions(text, this.props.suggestionsKey)
  }

  onAutocomplete(label, index) {
    if (this.props.onAutocomplete) {
      this.props.onAutocomplete(this.props.name, label, index)
    }
  }

  render() {
    const {
      value,
      suggestedStatements,
      ...props
    } = this.props
    delete props.suggestionsKey
    delete props.api
    delete props.onPropertyChange

    const suggestions = suggestedStatements.map(s => ({
      id: s.id,
      key: `autocomplete-${s.id}`,
      label: s.text,
    }))

    return (
      <Autocomplete
          {...props}
          type="text"
          value={value}
          // maxLength={2048}
          pattern=".+"
          onChange={this.onChange}
          data={suggestions}
          filter={null}
          dataLabel="label"
          dataValue="id"
          onAutocomplete={this.onAutocomplete}
          onKeyDown={this.onKeyDown}
          ref={el => this.autocomplete = el}
      />
    )
  }
}
StatementTextAutocomplete.propTypes = {
  /** The value to display in the text input */
  value: PropTypes.string,
  /** Where to store the component's suggestions in the react state (under state.app.statementSuggestions) */
  suggestionsKey: PropTypes.string.isRequired,
  /** The callback for when a user modifies the value in the text input.  Arguments: (val, event) */
  onPropertyChange: PropTypes.func,
  /** The callback for when the user selects a suggestion.  Arguments: (label, index) */
  onAutocomplete: PropTypes.func,
}

const mapStateToProps = (state, ownProps) => {
  const suggestedStatementIds = state.app.statementSuggestions[ownProps.suggestionsKey] || []
  const suggestedStatements = denormalize(suggestedStatementIds, [statementSchema], state.entities)
  return {
    suggestedStatements
  }
}

export default connect(mapStateToProps, mapActionCreatorGroupToDispatchToProps({
  api
}))(StatementTextAutocomplete)
