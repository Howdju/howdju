import React, {Component} from "react"
import PropTypes from 'prop-types'
import throttle from 'lodash/throttle'
import Autocomplete from 'react-md/lib/Autocompletes'
import { connect } from 'react-redux'
import map from 'lodash/map'

import autocompleter from './autocompleter'
import {
  ESCAPE_KEY_CODE, RETURN_KEY_CODE
} from './keyCodes'
import {
  autocompletes,
  mapActionCreatorGroupToDispatchToProps
} from "./actions"
import {denormalize} from "normalizr"

const dataLabel = 'data-label'
const dataValue = 'data-value'

const hasFocus = el => window.document.activeElement === el

class ApiAutocomplete extends Component {

  componentWillMount() {
    this.throttledRefreshAutocomplete = throttle(this.refreshAutocomplete.bind(this), this.props.autocompleteThrottle)
  }

  componentWillReceiveProps(nextProps) {
    autocompleter.fixOpen(this.autocomplete, nextProps.value, nextProps.transformedSuggestions)
    if (this.props.forcedClosed) {
      this.closeAutocomplete()
    }
    if (this.props.autocompleteThrottle !== nextProps.autocompleteThrottle) {
      this.throttledRefreshAutocomplete = throttle(this.refreshAutocomplete.bind(this), nextProps.autocompleteThrottle)
    }
  }

  onChange = (val, event) => {
    const name = event.target.name
    this.onPropertyChange({[name]: val})
  }

  onPropertyChange = (properties) => {
    this.props.onPropertyChange(properties)
    const val = properties[this.props.name]
    if (val) {
      this.throttledRefreshAutocomplete(val)
    } else {
      this.throttledRefreshAutocomplete.cancel()
      this.clearSuggestions()
    }
  }

  onKeyDown = (event) => {
    if (event.keyCode === ESCAPE_KEY_CODE) {
      this.throttledRefreshAutocomplete.cancel()
      if (this.isAutocompleteOpen()) {
        event.preventDefault()
        event.stopPropagation()
        this.closeAutocomplete()
        return
      } else if (this.props.value && this.props.escapeClears) {
        event.preventDefault()
        event.stopPropagation()
        this.onPropertyChange({[this.props.name]: ''})
        return
      }
    } else if (event.keyCode === RETURN_KEY_CODE) {
      this.closeAutocomplete()
    }

    if (this.props.onKeyDown) {
      this.props.onKeyDown(event)
    }
  }

  onTouchEnd = () => {
    // Mobile devices need some way to hide the autocomplete, since they lack escape button or the screen space to click around
    // (Sometimes the touchend fires a click and sometimes it doesn't, so handle touch explicitly)
    this.closeAutocomplete()
  }

  onClick = () => {
    // For parity with mobile devices, close the auto complete upon click
    this.closeAutocomplete()
  }

  isAutocompleteOpen = () => {
    return this.autocomplete.state.isOpen
  }

  closeAutocomplete = () => {
    this.autocomplete._close()
  }

  refreshAutocomplete = (value) => {
    this.props.fetchSuggestions(value, this.props.suggestionsKey)
  }

  onAutocomplete = (label, index, transformedSuggestions) => {
    if (this.props.onAutocomplete) {
      const suggestion = this.props.suggestions[index]
      this.props.onAutocomplete(suggestion)
    }
  }

  onMenuOpen = (event) => {
    // react-md is opening the autocomplete when it doesn't have focus
    if (!hasFocus(this.autocomplete._field)) {
      this.closeAutocomplete()
    }
    if (this.props.forcedClosed) {
      this.closeAutocomplete()
    }
  }

  onBlur = (event) => {
    this.throttledRefreshAutocomplete.cancel()
    if (this.props.cancelSuggestions) {
      this.props.cancelSuggestions(this.props.suggestionsKey)
    }
    if (this.props.suggestions && this.props.suggestions.length > 0) {
      this.clearSuggestions()
    }
  }

  clearSuggestions = () => {
    this.props.autocompletes.clearSuggestions(this.props.suggestionsKey)
  }

  setAutocomplete = (autocomplete) => this.autocomplete = autocomplete

  render() {
    const {
      value,
      transformedSuggestions,
      // ignore
      autocompletes,
      autocompleteThrottle,
      dispatch,
      escapeClears,
      fetchSuggestions,
      cancelSuggestions,
      suggestions,
      suggestionsKey,
      suggestionTransform,
      onPropertyChange,
      forcedClosed,
      suggestionSchema,
      ...rest
    } = this.props

    return (
      <Autocomplete {...rest}
                    type="text"
                    value={value}
                    dataLabel={dataLabel}
                    dataValue={dataValue}
                    onChange={this.onChange}
                    onKeyDown={this.onKeyDown}
                    onAutocomplete={this.onAutocomplete}
                    onMenuOpen={this.onMenuOpen}
                    onBlur={this.onBlur}
                    onTouchEnd={this.onTouchEnd}
                    onClick={this.onClick}
                    data={transformedSuggestions}
                    filter={null}
                    ref={this.setAutocomplete}
                    focusInputOnAutocomplete={false}
      />
    )
  }
}
ApiAutocomplete.propTypes = {
  /** ms to throttle autocomplete refresh by */
  autocompleteThrottle: PropTypes.number,
  /** If the result of suggestionTransform is an object, this property is required and tells the autocomplete which property of the object is the label */
  dataLabel: PropTypes.string,
  /** Optional name of property to extract from the suggestion to use as a react key */
  dataValue: PropTypes.string,
  /** If true, pressing escape when the suggestions are already hidden will clear the field */
  escapeClears: PropTypes.bool,
  /** A dispatch-wrapped actionCreator to update the suggestions. */
  fetchSuggestions: PropTypes.func,
  /** A dispatch-wrapped actionCreator to cancel updating the suggestions */
  cancelSuggestions: PropTypes.func,
  /** Where to store the component's suggestions in the react state (under state.autocompletes.suggestions) */
  suggestionsKey: PropTypes.string.isRequired,
  /** The callback for when a user modifies the value in the text input.  Arguments: (val, event) */
  onPropertyChange: PropTypes.func,
  /** The callback for when the user selects a suggestion.  Arguments: (label, index) */
  onAutocomplete: PropTypes.func,
  /** An optional function for transforming the stored suggestions.  Called
   * with item to transform.  Provides flexibility when the results from
   * the API don't match the form required for the Autocomplete
   */
  suggestionTransform: PropTypes.func,
  /** The value to display in the text input */
  value: PropTypes.string,
  onKeyDown: PropTypes.func,
  /** If true, will try to kee[ autocomplete closed */
  forcedClosed: PropTypes.bool,
  /** The schema which the component uses to denormalize suggestions */
  suggestionSchema: PropTypes.object.isRequired,
}
ApiAutocomplete.defaultProps = {
  autocompleteThrottle: 250,
  escapeClears: false,
}

/** Pluck the properties from the model and give them names appropriate to a DOM element; react-md will put all its members as attributes on the element */
const defaultSuggestionTransform = (props) => (model) => ({
  [dataLabel]: model[props.dataLabel],
  [dataValue]: model[props.dataValue],
})

const mapStateToProps = (state, ownProps) => {
  const normalized = state.autocompletes.suggestions[ownProps.suggestionsKey]
  const suggestions = denormalize(normalized, [ownProps.suggestionSchema], state.entities) || []
  const transformedSuggestions = ownProps.suggestionTransform ?
    map(suggestions, ownProps.suggestionTransform).map(defaultSuggestionTransform(ownProps)) :
    map(suggestions, defaultSuggestionTransform(ownProps))

  return {
    suggestions,
    transformedSuggestions,
  }
}

export default connect(mapStateToProps, mapActionCreatorGroupToDispatchToProps({
  autocompletes,
}))(ApiAutocomplete)
