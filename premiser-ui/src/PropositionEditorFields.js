import React, {Component} from 'react'
import PropTypes from 'prop-types'
import get from 'lodash/get'
import has from 'lodash/has'

import SingleLineTextField from "./SingleLineTextField"
import PropositionTextAutocomplete from './PropositionTextAutocomplete'
import {toErrorText} from "./modelErrorMessages"
import ErrorMessages from "./ErrorMessages"
import {
  combineIds,
  combineNames,
  combineSuggestionsKeys,
} from './viewModels'


const textName = 'text'

export default class PropositionEditorFields extends Component {

  render() {
    const {
      id,
      textId,
      proposition,
      suggestionsKey,
      name,
      textLabel,
      disabled,
      onPropertyChange,
      errors,
      onKeyDown,
      onSubmit,
      ...rest
    } = this.props

    const modelErrors = errors && errors.modelErrors
    const textErrorProps = errors && errors.hasErrors && errors.fieldErrors.text.length > 0 ?
      {error: true, errorText: toErrorText(errors.fieldErrors.text)} :
      null

    const hasText = has(proposition, textName)
    const text = get(proposition, textName, '')

    const textProps = {
      id: textId || combineIds(id, 'text'),
      name: combineNames(name, textName),
      label: textLabel,
      value: text,
      required: true,
      onKeyDown,
      onSubmit,
      onPropertyChange,
      disabled: disabled || !hasText
    }

    const textInput = (suggestionsKey && !disabled) ?
      <PropositionTextAutocomplete
        {...rest}
        {...textErrorProps}
        {...textProps}
        suggestionsKey={combineSuggestionsKeys(suggestionsKey, textName)}
      /> :
      <SingleLineTextField
        {...rest}
        {...textErrorProps}
        {...textProps}
      />
    return (
      <div>
        <ErrorMessages errors={modelErrors}/>
        {textInput}
      </div>
    )
  }
}
PropositionEditorFields.propTypes = {
  proposition: PropTypes.object,
  id: PropTypes.string.isRequired,
  /** An optional override of the ID of the input for editing the Proposition text.  If absent, an ID will be auto generated based upon {@see id} */
  textId: PropTypes.string,
  /** If present, this string will be prepended to this editor's controls' names, with an intervening "." */
  name: PropTypes.string,
  /** If omitted, no autocomplete */
  suggestionsKey: PropTypes.string,
  onPropertyChange: PropTypes.func.isRequired,
  errors: PropTypes.object,
  disabled: PropTypes.bool,
  onKeyDown: PropTypes.func,
  /** If present, overrides the default label for the proposition text input */
  textLabel: PropTypes.string,
}
PropositionEditorFields.defaultProps = {
  disabled: false,
  textLabel: 'Text',
}
