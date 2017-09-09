import React, {Component} from 'react'
import PropTypes from 'prop-types'
import TextField from 'react-md/lib/TextFields/TextField'
import FontIcon from 'react-md/lib/FontIcons'
import Button from 'react-md/lib/Buttons/Button'
import cn from 'classnames'
import map from 'lodash/map'
import get from 'lodash/get'
import has from 'lodash/has'

import {RETURN_KEY_CODE} from "./keyCodes"
import WritingTitleAutocomplete from "./WritingTitleAutocomplete"
import {toErrorText} from "./modelErrorMessages"
import ErrorMessages from './ErrorMessages'

import './WritingQuoteEditorFields.scss'

const writingQuoteTextName = 'text'
const writingTitleName = 'writing.title'

class WritingQuoteEditorFields extends Component {

  onChange = (value, event) => {
    const target = event.target
    const name = target.name
    this.props.onPropertyChange({[name]: value})
  }

  onPropertyChange = (properties) => {
    this.props.onPropertyChange(properties)
  }

  onTextInputKeyDown = (event) => {
    if (event.keyCode === RETURN_KEY_CODE && this.props.onSubmit) {
      this.props.onSubmit(event)
    } else if (this.props.onKeyDown) {
      this.props.onKeyDown(event)
    }
  }

  render() {
    const {
      writingQuote,
      name,
      id,
      quoteTextId,
      suggestionsKey,
      disabled,
      errors,
    } = this.props

    const urls = get(writingQuote, 'urls', [])
    const namePrefix = name ? name + '.' : ''
    const idPrefix = id ? id + '.' : ''
    const suggestionsKeyPrefix = suggestionsKey ? suggestionsKey + '.' : ''

    const hasErrors = get(errors, 'hasErrors')
    const quoteInputProps = hasErrors && errors.fieldErrors.quoteText.length > 0 ?
      {error: true, errorText: toErrorText(errors.fieldErrors.quoteText)} :
      {}
    const writingTitleInputProps = hasErrors && errors.fieldErrors.writing.fieldErrors.title.length > 0 ?
      {error: true, errorText: toErrorText(errors.fieldErrors.writing.fieldErrors.title)} :
      {}
    const urlInputProps = hasErrors ?
      map(errors.fieldErrors.urls.itemErrors, urlError => urlError.fieldErrors.url.length > 0 ?
        {error: true, errorText: toErrorText(urlError.fieldErrors.url)} :
        {}
      ) :
      map(urls, () => null)

    const quoteText = get(writingQuote, writingQuoteTextName) || ''
    const writingTitle = get(writingQuote, writingTitleName) || ''
    const hasWritingTitle = has(writingQuote, writingTitleName)

    return (
      <div>
        <TextField {...quoteInputProps}
                   id={quoteTextId || (idPrefix + "quoteText")}
                   key="quoteText"
                   name={namePrefix + writingQuoteTextName}
                   type="text"
                   label="Quote"
                   rows={2}
                   maxRows={4}
                   value={quoteText}
                   onChange={this.onChange}
                   leftIcon={<FontIcon>format_quote</FontIcon>}
                   disabled={disabled || !has(writingQuote, writingQuoteTextName)}
                   onKeyDown={this.onTextInputKeyDown}
        />
        {suggestionsKey && !disabled && hasWritingTitle ?
          <WritingTitleAutocomplete {...writingTitleInputProps}
                                    id={idPrefix + writingTitleName}
                                    key={writingTitleName}
                                    name={namePrefix + writingTitleName}
                                    suggestionsKey={suggestionsKeyPrefix + writingTitleName}
                                    label="Writing"
                                    value={writingTitle}
                                    required
                                    onPropertyChange={this.onPropertyChange}
                                    leftIcon={<FontIcon>book</FontIcon>}
                                    disabled={disabled || !hasWritingTitle}
                                    onKeyDown={this.onTextInputKeyDown}
          /> :
          <TextField {...writingTitleInputProps}
                     id={idPrefix + writingTitleName}
                     name={namePrefix + writingTitleName}
                     label="Citation"
                     type="text"
                     value={writingTitle}
                     required
                     onChange={this.onChange}
                     leftIcon={<FontIcon>book</FontIcon>}
                     disabled={disabled || !hasWritingTitle}
                     onKeyDown={this.onTextInputKeyDown}
          />
        }
        {map(urls, (url, index) =>
          <TextField {...urlInputProps[index]}
                     id={`${idPrefix}urls[${index}].url`}
                     key={`urls[${index}].url`}
                     name={`${namePrefix}urls[${index}].url`}
                     className="urlInput"
                     type="url"
                     label="URL"
                     value={get(writingQuote, `urls[${index}].url`, '')}
                     onChange={this.onChange}
                     leftIcon={<FontIcon>link</FontIcon>}
                     rightIcon={disabled ? <div/> : <Button icon onClick={(e) => this.props.onRemoveUrl(url, index)}>delete</Button>}
                     disabled={!!url.id || disabled}
                     onKeyDown={this.onTextInputKeyDown}
          />
        )}
        <Button flat
                className={cn('addButton', {
                  hidden: disabled,
                })}
                key="addUrlButton"
                label="Add URL"
                onClick={this.props.onAddUrl}
        >add</Button>
        {hasErrors && errors.modelErrors && (
          <ErrorMessages errors={errors.modelErrors} />
        )}
      </div>
    )
  }
}
WritingQuoteEditorFields.propTypes = {
  writingQuote: PropTypes.object,
  /** If present, this string will be prepended to this editor's controls' ids, with an intervening "." */
  id: PropTypes.string,
  quoteTextId: PropTypes.string,
  /** If present, this string will be prepended to this editor's controls' names, with an intervening "." */
  name: PropTypes.string,
  /** If present, called when the user presses enter in a text field */
  onSubmit: PropTypes.func,
  onPropertyChange: PropTypes.func.isRequired,
  onAddUrl: PropTypes.func.isRequired,
  onRemoveUrl: PropTypes.func.isRequired,
  errors: PropTypes.object,
  /** Whether to disable the inputs */
  disabled: PropTypes.bool,
}
WritingQuoteEditorFields.defaultProps = {
  disabled: false,
}

export default WritingQuoteEditorFields