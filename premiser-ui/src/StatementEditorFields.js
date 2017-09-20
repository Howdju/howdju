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
      id,
      textId,
      statement,
      suggestionsKey,
      name,
      textLabel,
      disabled,
      onPropertyChange,
      errors,
      ...rest,
    } = this.props
    delete rest.onKeyDown

    const modelErrors = errors && errors.modelErrors
    const textErrorProps = errors && errors.hasErrors && errors.fieldErrors.text.length > 0 ?
      {error: true, errorText: toErrorText(errors.fieldErrors.text)} :
      null

    const namePrefix = name ? name + '.' : ''
    const suggestionsKeyPrefix = suggestionsKey ? suggestionsKey + '.' : ''
    const hasText = has(statement, textName)
    const text = get(statement, textName, '')

    const textProps = {
      id: textId || id + '-text',
      name: namePrefix + textName,
      label: textLabel,
      value: text,
      required: true,
      leftIcon: <FontIcon>short_text</FontIcon>,
      onKeyDown: this.onTextInputKeyDown,
    }
    const input = (suggestionsKey && !disabled) ?
      <StatementTextAutocomplete {...rest}
                                 {...textErrorProps}
                                 {...textProps}
                                 onPropertyChange={onPropertyChange}
                                 suggestionsKey={suggestionsKeyPrefix + textName}
      /> :
      <TextField {...rest}
                 {...textErrorProps}
                 {...textProps}
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
  id: PropTypes.string.isRequired,
  /** An optional override of the ID of the input for editing the Statement text.  If absent, an ID will be auto generated based upon {@see id} */
  textId: PropTypes.string,
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
  /** If present, overrides the default label for the statement text input */
  textLabel: PropTypes.string,
}
StatementEditorFields.defaultProps = {
  disabled: false,
  textLabel: 'Text',
}

export default StatementEditorFields