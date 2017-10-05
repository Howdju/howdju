import React, {Component} from 'react'
import PropTypes from 'prop-types'
import TextField from 'react-md/lib/TextFields/TextField'
import Button from 'react-md/lib/Buttons/Button'
import map from 'lodash/map'
import get from 'lodash/get'
import has from 'lodash/has'

import WritTitleAutocomplete from "./WritTitleAutocomplete"
import {toErrorText} from "./modelErrorMessages"
import ErrorMessages from './ErrorMessages'
import SingleLineTextField from './SingleLineTextField'

import './WritQuoteEditorFields.scss'


const writQuoteTextName = 'quoteText'
const writTitleName = 'writ.title'

class WritQuoteEditorFields extends Component {

  onChange = (value, event) => {
    if (this.props.onPropertyChange) {
      const target = event.target
      const name = target.name
      this.props.onPropertyChange({[name]: value})
    }
  }

  render() {
    const {
      writQuote,
      name,
      id,
      suggestionsKey,
      disabled,
      errors,
      onKeyDown,
      onSubmit,
      onPropertyChange,
    } = this.props

    const urls = get(writQuote, 'urls', [])
    const namePrefix = name ? name + '.' : ''
    const idPrefix = id ? id + '.' : ''
    const suggestionsKeyPrefix = suggestionsKey ? suggestionsKey + '.' : ''

    const hasErrors = get(errors, 'hasErrors')
    const quoteInputErrorProps = hasErrors && errors.fieldErrors.quoteText.length > 0 ?
      {error: true, errorText: toErrorText(errors.fieldErrors.quoteText)} :
      {}
    const writTitleInputErrorProps = hasErrors && errors.fieldErrors.writ.fieldErrors.title.length > 0 ?
      {error: true, errorText: toErrorText(errors.fieldErrors.writ.fieldErrors.title)} :
      {}
    const urlInputErrorProps = hasErrors ?
      map(errors.fieldErrors.urls.itemErrors, urlError => urlError.fieldErrors.url.length > 0 ?
        {error: true, errorText: toErrorText(urlError.fieldErrors.url)} :
        {}
      ) :
      map(urls, () => null)

    const quoteText = get(writQuote, writQuoteTextName) || ''
    const writTitle = get(writQuote, writTitleName) || ''
    const hasWritTitle = has(writQuote, writTitleName)

    const writTitleInputProps = {
      id: idPrefix + writTitleName,
      name: namePrefix + writTitleName,
      label: "Title",
      value: writTitle,
      maxLength: 2048,
      required: true,
      disabled: disabled || !hasWritTitle,
      onKeyDown,
      onSubmit,
      onPropertyChange,
    }

    return (
      <div className="writ-quote-editor-fields">
        <TextField
          {...quoteInputErrorProps}
          id={idPrefix + "quoteText"}
          key="quoteText"
          name={namePrefix + writQuoteTextName}
          type="text"
          label="Quote"
          rows={2}
          maxRows={4}
          maxLength={65536}
          value={quoteText}
          onChange={this.onChange}
          disabled={disabled || !has(writQuote, writQuoteTextName)}
          onKeyDown={onKeyDown}
        />
        {suggestionsKey && !disabled && hasWritTitle ?
          <WritTitleAutocomplete
            {...writTitleInputProps}
            {...writTitleInputErrorProps}
            suggestionsKey={suggestionsKeyPrefix + writTitleName}
          /> :
          <SingleLineTextField
            {...writTitleInputProps}
            {...writTitleInputErrorProps}
          />
        }
        {map(urls, (url, index) =>
          <SingleLineTextField
            {...urlInputErrorProps[index]}
            id={`${idPrefix}urls[${index}].url`}
            key={`urls[${index}].url`}
            name={`${namePrefix}urls[${index}].url`}
            className="urlInput"
            type="url"
            label="URL"
            value={get(writQuote, `urls[${index}].url`, '')}
            onChange={this.onChange}
            rightIcon={
              <Button
                icon
                onClick={(e) => this.props.onRemoveUrl(url, index)}
                disabled={disabled}
              >delete</Button>
            }
            disabled={!!url.id || disabled}
            onKeyDown={onKeyDown}
            onSubmit={onSubmit}
          />
        )}
        <Button
          flat
          className="add-button"
          key="addUrlButton"
          label="Add URL"
          onClick={this.props.onAddUrl}
          disabled={disabled}
        >add</Button>
        {hasErrors && errors.modelErrors && (
          <ErrorMessages errors={errors.modelErrors} />
        )}
      </div>
    )
  }
}
WritQuoteEditorFields.propTypes = {
  writQuote: PropTypes.object,
  /** If present, this string will be prepended to this editor's controls' ids, with an intervening "." */
  id: PropTypes.string,
  quoteTextId: PropTypes.string,
  /** If present, this string will be prepended to this editor's controls' names, with an intervening "." */
  name: PropTypes.string,
  onPropertyChange: PropTypes.func.isRequired,
  onAddUrl: PropTypes.func.isRequired,
  onRemoveUrl: PropTypes.func.isRequired,
  errors: PropTypes.object,
  /** Whether to disable the inputs */
  disabled: PropTypes.bool,
}
WritQuoteEditorFields.defaultProps = {
  disabled: false,
}

export default WritQuoteEditorFields