import React, {Component} from 'react'
import PropTypes from 'prop-types'
import FontIcon from 'react-md/lib/FontIcons'
import TextField from "react-md/lib/TextFields"
import get from 'lodash/get'
import has from 'lodash/has'

import StatementTextAutocomplete from './StatementTextAutocomplete'
import {toErrorText} from "./modelErrorMessages"
import {RETURN_KEY_CODE} from "./keyCodes"
import ErrorMessages from "./ErrorMessages"

const textName = 'text'

class StatementEditorFields extends Component {

  onTextInputKeyDown = (event) => {
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
    const errorInputProps = errors && errors.hasErrors && errors.fieldErrors.text.length > 0 ?
      {error: true, errorText: toErrorText(errors.fieldErrors.text)} :
      null

    const namePrefix = name ? name + '.' : ''
    const suggestionsKeyPrefix = suggestionsKey ? suggestionsKey + '.' : ''
    const hasText = has(statement, textName)
    const text = get(statement, textName, '')

    const statementTextInputProps = {
      id: textId,
      name: namePrefix + textName,
      label: "Text",
      value: text,
      required: true,
      leftIcon: <FontIcon>short_text</FontIcon>,
      onKeyDown: this.onTextInputKeyDown,
    }
    const input = (suggestionsKey && !disabled) ?
      <StatementTextAutocomplete {...rest}
                                 {...errorInputProps}
                                 {...statementTextInputProps}
                                 onPropertyChange={onPropertyChange}
                                 suggestionsKey={suggestionsKeyPrefix + textName}
      /> :
      <TextField {...rest}
                 {...errorInputProps}
                 {...statementTextInputProps}
                 rows={1}
                 maxRows={4}
                 disabled={disabled || !hasText}
                 type="text"
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
  /** If present, will handle enter-key-presses in text fields */
  onSubmit: PropTypes.func,
}
StatementEditorFields.defaultProps = {
  disabled: false,
}

export default StatementEditorFields