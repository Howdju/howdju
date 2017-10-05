import React, {Component} from 'react'
import PropTypes from 'prop-types'
import get from 'lodash/get'
import has from 'lodash/has'

import SingleLineTextField from "./SingleLineTextField"
import StatementTextAutocomplete from './StatementTextAutocomplete'
import {toErrorText} from "./modelErrorMessages"
import ErrorMessages from "./ErrorMessages"

const textName = 'text'

class StatementEditorFields extends Component {

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
      onKeyDown,
      onSubmit,
      ...rest,
    } = this.props

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
      onKeyDown,
      onSubmit,
      onPropertyChange,
      disabled: disabled || !hasText
    }

    const input = (suggestionsKey && !disabled) ?
      <StatementTextAutocomplete
        {...rest}
        {...textErrorProps}
        {...textProps}
        suggestionsKey={suggestionsKeyPrefix + textName}
      /> :
      <SingleLineTextField
        {...rest}
        {...textErrorProps}
        {...textProps}
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
  /** If present, overrides the default label for the statement text input */
  textLabel: PropTypes.string,
}
StatementEditorFields.defaultProps = {
  disabled: false,
  textLabel: 'Text',
}

export default StatementEditorFields