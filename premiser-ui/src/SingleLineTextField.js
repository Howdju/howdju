import React, {Component} from 'react'
import {TextField} from 'react-md'
import PropTypes from 'prop-types'
import isNull from 'lodash/isNull'

import {
  toSingleLine
} from 'howdju-common'

import {
  Keys
} from './keyCodes'

export default class SingleLineTextField extends Component {

  static propTypes = {
    name: PropTypes.string,
    type: PropTypes.string,
    // ignored if type=password
    rows: PropTypes.number,
    // ignored if type=password
    maxRows: PropTypes.number,
    disabled: PropTypes.bool,
    onKeyDown: PropTypes.func,
    onSubmit: PropTypes.func,
    onPropertyChange: PropTypes.func,
  }

  static defaultProps = {
    rows: 1,
    maxRows: 4,
    type: 'text',
  }

  render() {
    const {
      name,
      type,
      value,
      rows,
      maxRows,
      disabled,
      // ignore
      onKeyDown,
      onSubmit,
      onPropertyChange,
      ...rest
    } = this.props
    // password inputs must be <input>, which don't support rows.  If you try it becomes a <textfield> and shows the password!
    const rowProps = type !== 'password' ? {rows, maxRows} : {}
    // ``value` prop on `textarea` should not be null. Consider using an empty string to clear the component or `undefined` for uncontrolled components.`
    const textareaValue = isNull(value) ? '' : value
    return (
      <TextField
        {...rest}
        name={name}
        type={type}
        value={textareaValue}
        {...rowProps}
        disabled={disabled}
        onKeyDown={this.onKeyDown}
        onChange={this.onChange}
      />
    )
  }

  onKeyDown = (event) => {
    if (this.props.onKeyDown) {
      this.props.onKeyDown(event)
      if (event.defaultPrevented) {
        return
      }
    }
    if (event.key === Keys.ENTER) {
      // No line breaks in single-line text fields
      event.preventDefault()
      if (this.props.onSubmit) {
        this.props.onSubmit(event)
      }
    }
  }

  onChange = (val, event) => {
    const name = event.target.name
    const singleLineVal = toSingleLine(val)
    this.onPropertyChange({[name]: singleLineVal})
  }

  onPropertyChange = (properties) => {
    if (this.props.onPropertyChange) {
      this.props.onPropertyChange(properties)
    }
  }
}
