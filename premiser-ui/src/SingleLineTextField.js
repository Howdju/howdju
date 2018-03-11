import React, {Component} from 'react'
import {TextField} from 'react-md'

import {
  toSingleLine
} from 'howdju-common'

import {
  Keys
} from './keyCodes'

export default class SingleLineTextField extends Component {

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

  render() {
    const {
      name,
      rows,
      maxRows,
      disabled,
      // ignore
      onKeyDown,
      onSubmit,
      onPropertyChange,
      ...rest,
    } = this.props
    return (
      <TextField
        {...rest}
        name={name}
        rows={rows}
        maxRows={maxRows}
        disabled={disabled}
        type="text"
        onKeyDown={this.onKeyDown}
        onChange={this.onChange}
      />
    )
  }
}
SingleLineTextField.defaultProps = {
  rows: 1,
  maxRows: 4,
}