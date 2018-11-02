import React from 'react'
import PropTypes from 'prop-types'
import {
  FontIcon,
} from 'react-md'

import {
  isValidUrl,
  hasValidDomain,
} from './util'
import SingleLineTextField from './SingleLineTextField'

export default class UrlTextField extends React.Component {

  static propTypes = {
    /** If present, the value must pass this predicate for the control to be valid */
    validator: PropTypes.func,
    /** Error text to display when the value is invalid (is an invalid URL or fails the validator) */
    invalidErrorText: PropTypes.string
  }

  constructor() {
    super()
    this.state = {
      isValid: true,
      errorText: '',
    }
  }

  onPropertyChange = (properties) => {
    let isValid = true
    let errorText = ''
    for (const property of Object.keys(properties)) {
      const value = properties[property]
      if (value && (
        !isValidUrl(value)
        || !hasValidDomain(value)
        || this.props.validator && !this.props.validator(value)
      )) {
        isValid = false
        break
      }
    }
    this.setState({isValid, errorText})
  }

  render() {
    const {
      // ignore
      validator,
      //ignopre
      invalidErrorText,
      ...rest
    } = this.props
    const {
      isValid,
    } = this.state

    const props = {
      ...rest,
      value: rest.value || '',
      onPropertyChange: this.onPropertyChange,
      leftIcon: <FontIcon>link</FontIcon>,
    }

    if (!isValid) {
      props['error'] = true
      props['errorText'] = this.props.invalidErrorText || "Must be a valid web address"
    }

    return (
      <SingleLineTextField {...props} />
    )
  }
}