import React, {Component} from "react"
import PropTypes from 'prop-types'
import throttle from 'lodash/throttle'
import Autocomplete from 'react-md/lib/Autocompletes'
import { connect } from 'react-redux'

import {
  ESCAPE_KEY_CODE
} from './keyCodes'
import autocompleter from './autocompleter'
import {
  autocompletes,
  mapActionCreatorGroupToDispatchToProps
} from "./actions";

const dataLabel = 'data-label'
const dataValue = 'data-value'

class ApiAutocomplete extends Component {

  constructor() {
    super()

    this.onChange = this.onChange.bind(this)
    this.onAutocomplete = this.onAutocomplete.bind(this)
    this.onKeyDown = this.onKeyDown.bind(this)
  }

  componentWillReceiveProps(nextProps) {
    autocompleter.fixOpen(this.autocomplete, nextProps.value, nextProps.transformedSuggestions)
    if (this.props.autocompleteThrottle !== nextProps.autocompleteThrottle || !this.throttledRefreshAutocomplete) {
      this.throttledRefreshAutocomplete = throttle(this.refreshAutocomplete.bind(this), nextProps.autocompleteThrottle)
    }
  }

  onChange(val, e) {
    const name = e.target.name
    this.onPropertyChange({[name]: val})
  }

  onPropertyChange(properties) {
    this.props.onPropertyChange(properties)
    const val = properties[this.props.name]
    if (val) {
      // TODO I'm not sure why this is undefined the first time this is called...shouldn't it have been set in componentWillReceiveProps?
      if (this.throttledRefreshAutocomplete) {
        this.throttledRefreshAutocomplete(val)
      } else {
        this.refreshAutocomplete(val)
      }
    } else {
      if (this.throttledRefreshAutocomplete) {
        this.throttledRefreshAutocomplete.cancel()
      }
      this.props.autocompletes.clearSuggestions(this.props.suggestionsKey)
    }
  }

  onKeyDown(e) {
    if (e.keyCode === ESCAPE_KEY_CODE) {
      e.preventDefault()
      e.stopPropagation()
      this.throttledRefreshAutocomplete.cancel()
      if (this.autocomplete.state.isOpen) {
        this.autocomplete._close()
      } else if (this.props.escapeClears) {
        this.onPropertyChange({[this.props.name]: ''})
      }
    } else if (this.props.onKeyDown) {
      this.props.onKeyDown(e)
    }
  }

  refreshAutocomplete(value) {
    this.props.fetchSuggestions(value, this.props.suggestionsKey)
  }

  onAutocomplete(label, index, transformedSuggestions) {
    if (this.props.onAutocomplete) {
      const suggestion = this.props.suggestions[index]
      this.props.onAutocomplete(suggestion)
    }
  }

  render() {
    const {
      value,
      transformedSuggestions,
      ...props
    } = this.props
    delete props.autocompletes
    delete props.autocompleteThrottle
    delete props.dispatch
    delete props.escapeClears
    delete props.fetchSuggestions
    delete props.suggestions
    delete props.suggestionsKey
    delete props.suggestionTransform
    delete props.onPropertyChange

    return (
        <Autocomplete
            {...props}
            type="text"
            value={value}
            dataLabel={dataLabel}
            dataValue={dataValue}
            onChange={this.onChange}
            data={transformedSuggestions}
            filter={null}
            onAutocomplete={this.onAutocomplete}
            onKeyDown={this.onKeyDown}
            ref={el => this.autocomplete = el}
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
}
ApiAutocomplete.defaultProps = {
  autocompleteThrottle: 250,
  escapeClears: false,
}

/** Pluck the properties from the model and give them names appropriate to a DOM element; react-md will put all its members as attributes on the element */
const defaultSuggestionTransform = props => model => ({
  [dataLabel]: model[props.dataLabel],
  [dataValue]: model[props.dataValue],
})

const mapStateToProps = (state, ownProps) => {
  const suggestions = state.autocompletes.suggestions[ownProps.suggestionsKey] || []
  const transformedSuggestions = ownProps.suggestionTransform ?
      suggestions.map(ownProps.suggestionTransform).map(defaultSuggestionTransform(ownProps)) :
      suggestions.map(defaultSuggestionTransform(ownProps))

  return {
    suggestions,
    transformedSuggestions,
  }
}

export default connect(mapStateToProps, mapActionCreatorGroupToDispatchToProps({
  autocompletes,
}))(ApiAutocomplete)
