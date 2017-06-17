import React, {Component} from 'react'
import PropTypes from 'prop-types'
import FontIcon from 'react-md/lib/FontIcons'
import StatementTextAutocomplete from './StatementTextAutocomplete'
import TextField from "react-md/lib/TextFields";
import {toErrorText} from "./modelErrorMessages";
import {RETURN_KEY_CODE} from "./keyCodes";

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
    }
  }

  render() {
    const {
      statement,
      suggestionsKey,
      name,
      id,
      readOnly,
      onPropertyChange,
      errors,
      ...rest,
    } = this.props

    const textInputProps = errors && errors.hasErrors && errors.fieldErrors.text.length > 0 ?
        {...rest, error: true, errorText: toErrorText(errors.fieldErrors.text)} :
        rest

    const idPrefix = id ? id + '.' : ''
    const namePrefix = name ? name + '.' : ''
    const suggestionsKeyPrefix = suggestionsKey ? suggestionsKey + '.' : ''
    const text = statement ? statement.text : ''

    return (suggestionsKey && !readOnly) ?
        <StatementTextAutocomplete id={idPrefix + "text"}
                                   name={namePrefix + "text"}
                                   label="Text"
                                   required
                                   value={text}
                                   suggestionsKey={suggestionsKeyPrefix + 'text'}
                                   onPropertyChange={onPropertyChange}
                                   leftIcon={<FontIcon>text_fields</FontIcon>}
                                   onKeyDown={this.onTextInputKeyDown}
                                   {...textInputProps}
        /> :
        <TextField id={idPrefix + 'text'}
                   name={namePrefix + "text"}
                   label="Text"
                   type="text"
                   value={text}
                   required
                   onChange={this.onChange}
                   leftIcon={<FontIcon>text_fields</FontIcon>}
                   disabled={readOnly}
                   onKeyDown={this.onTextInputKeyDown}
                   {...textInputProps}
        />
  }
}
StatementEditorFields.propTypes = {
  statement: PropTypes.object,
  /** If present, this string will be prepended to this editor's controls' ids, with an intervening "." */
  id: PropTypes.string,
  /** If present, this string will be prepended to this editor's controls' names, with an intervening "." */
  name: PropTypes.string,
  /** If omitted, no autocomplete */
  suggestionsKey: PropTypes.string,
  onPropertyChange: PropTypes.func.isRequired,
  readOnly: PropTypes.bool,
  errors: PropTypes.object,
}
StatementEditorFields.defaultProps = {
  readOnly: false
}

export default StatementEditorFields