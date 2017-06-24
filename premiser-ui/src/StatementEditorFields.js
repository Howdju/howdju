import React, {Component} from 'react'
import PropTypes from 'prop-types'
import FontIcon from 'react-md/lib/FontIcons'
import TextField from "react-md/lib/TextFields";
import get from 'lodash/get'
import has from 'lodash/has'

import StatementTextAutocomplete from './StatementTextAutocomplete'
import {toErrorText} from "./modelErrorMessages";
import {RETURN_KEY_CODE} from "./keyCodes";
import ErrorMessages from "./ErrorMessages";

const textName = 'text'

class StatementEditorFields extends Component {

  constructor() {
    super()

    this.onChange = this.onChange.bind(this)
    this.onTextInputKeyDown = this.onTextInputKeyDown.bind(this)
  }

  onChange(val, event) {
    const name = event.target.name
    this.props.onPropertyChange({[name]: val})
  }

  onTextInputKeyDown(event) {
    if (event.keyCode === RETURN_KEY_CODE && this.props.onSubmit) {
      event.preventDefault()
      this.props.onSubmit(event)
    } else if (this.props.onKeyDown) {
      this.props.onKeyDown(event)
    }
  }

  render() {
    const {
      statement,
      suggestionsKey,
      name,
      textId,
      disabled,
      onPropertyChange,
      errors,
      ...rest,
    } = this.props
    delete rest.onKeyDown


    const modelErrors = errors && errors.modelErrors
    const textInputProps = errors && errors.hasErrors && errors.fieldErrors.text.length > 0 ?
        {...rest, error: true, errorText: toErrorText(errors.fieldErrors.text)} :
        rest

    const namePrefix = name ? name + '.' : ''
    const suggestionsKeyPrefix = suggestionsKey ? suggestionsKey + '.' : ''
    const hasText = has(statement, textName)
    const text = get(statement, textName, '')

    const input = (suggestionsKey && !disabled && hasText) ?
        <StatementTextAutocomplete {...textInputProps}
                                   id={textId}
                                   name={namePrefix + textName}
                                   label="Text"
                                   required
                                   value={text}
                                   suggestionsKey={suggestionsKeyPrefix + textName}
                                   onPropertyChange={onPropertyChange}
                                   leftIcon={<FontIcon>text_fields</FontIcon>}
                                   onKeyDown={this.onTextInputKeyDown}
        /> :
        <TextField {...textInputProps}
                   id={textId}
                   name={namePrefix + textName}
                   label="Text"
                   type="text"
                   value={text}
                   required
                   onChange={this.onChange}
                   leftIcon={<FontIcon>text_fields</FontIcon>}
                   disabled={disabled || !hasText}
                   onKeyDown={this.onTextInputKeyDown}
        />
    return (
        <div>
          <ErrorMessages errors={modelErrors}/>
          {input}
        </div>
    )
  }
}
StatementEditorFields.propTypes = {
  statement: PropTypes.object,
  /** The id of the input for the statement's text.  Required by react-md's Autocomplete/TextField for accessibility */
  textId: PropTypes.string.isRequired,
  /** If present, this string will be prepended to this editor's controls' names, with an intervening "." */
  name: PropTypes.string,
  /** If omitted, no autocomplete */
  suggestionsKey: PropTypes.string,
  onPropertyChange: PropTypes.func.isRequired,
  errors: PropTypes.object,
  disabled: PropTypes.bool,
  onKeyDown: PropTypes.func,
}
StatementEditorFields.defaultProps = {
  disabled: false,
}

export default StatementEditorFields