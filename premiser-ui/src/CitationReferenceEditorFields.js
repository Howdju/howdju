import React, {Component} from 'react'
import PropTypes from 'prop-types'
import TextField from 'react-md/lib/TextFields/TextField'
import FontIcon from 'react-md/lib/FontIcons'
import Button from 'react-md/lib/Buttons/Button'
import cn from 'classnames'
import map from 'lodash/map'
import get from 'lodash/get'
import has from 'lodash/has'

import {RETURN_KEY_CODE} from "./keyCodes";
import CitationTextAutocomplete from "./CitationTextAutocomplete";
import {toErrorText} from "./modelErrorMessages";

import './CitationReferenceEditorFields.scss'

const quoteName = 'quote'
const citationTextName = 'citation.text'

class CitationReferenceEditorFields extends Component {
  constructor() {
    super()
    this.state = {
      isQuoteEditedAfterMount: false
    }
    this.onChange = this.onChange.bind(this)
    this.onPropertyChange = this.onPropertyChange.bind(this)
    this.onTextInputKeyDown = this.onTextInputKeyDown.bind(this)
  }

  componentDidMount() {
    this.setState({
      isQuoteEditedAfterMount: false
    })
  }

  onChange(value, event) {
    const target = event.target;
    const name = target.name
    this.props.onPropertyChange({[name]: value})
  }

  onPropertyChange(properties) {
    this.props.onPropertyChange(properties)
  }

  onTextInputKeyDown(event) {
    if (event.keyCode === RETURN_KEY_CODE && this.props.onSubmit) {
      this.props.onSubmit(event)
    } else if (this.props.onKeyDown) {
      this.props.onKeyDown(event)
    }
  }

  render() {
    const {
      citationReference,
      name,
      id,
      quoteId,
      suggestionsKey,
      disabled,
      errors,
    } = this.props
    const {
      isQuoteEditedAfterMount
    } = this.state

    const urls = get(citationReference, 'urls', [])
    const namePrefix = name ? name + '.' : ''
    const idPrefix = id ? id + '.' : ''
    const suggestionsKeyPrefix = suggestionsKey ? suggestionsKey + '.' : ''

    const quoteInputProps = errors && errors.hasErrors && errors.fieldErrors.quote.length > 0 ?
        {error: true, errorText: toErrorText(errors.fieldErrors.quote)} :
        {}
    const citationTextInputProps = errors && errors.hasErrors && errors.fieldErrors.citation.fieldErrors.text.length > 0 ?
        {error: true, errorText: toErrorText(errors.fieldErrors.citation.fieldErrors.text)} :
        {}
    const urlInputProps = (errors && errors.hasErrors) ?
        map(errors.fieldErrors.urls.itemErrors, urlError => urlError.fieldErrors.url.length > 0 ?
            {error: true, errorText: toErrorText(urlError.fieldErrors.url)} :
            {}
        ) :
        map(urls, () => null)

    const quote = get(citationReference, quoteName, '')
    const citationText = get(citationReference, citationTextName, '')
    const hasCitationText = has(citationReference, citationTextName)

    return (
        <div>
          <TextField {...quoteInputProps}
                     id={quoteId || (idPrefix + "quote")}
                     key="quote"
                     name={namePrefix + quoteName}
                     type="text"
                     label="Quote"
                     rows={2}
                     maxRows={4}
                     className={cn('hasIcon', {
                       editedAfterMount: isQuoteEditedAfterMount,
                       hasValue: !!quote,
                     })}
                     value={quote}
                     onChange={this.onChange}
                     leftIcon={<FontIcon>format_quote</FontIcon>}
                     disabled={disabled || !has(citationReference, quoteName)}
                     onKeyDown={this.onTextInputKeyDown}
          />
          {suggestionsKey && !disabled && hasCitationText ?
              <CitationTextAutocomplete {...citationTextInputProps}
                                        id={idPrefix + 'citation.text'}
                                        key="citation.text"
                                        name={namePrefix + citationTextName}
                                        suggestionsKey={suggestionsKeyPrefix + citationTextName}
                                        label="Citation"
                                        value={citationText}
                                        required
                                        onPropertyChange={this.onPropertyChange}
                                        leftIcon={<FontIcon>book</FontIcon>}
                                        disabled={disabled || !hasCitationText}
                                        onKeyDown={this.onTextInputKeyDown}
              /> :
              <TextField {...citationTextInputProps}
                         id={idPrefix + 'citation.text'}
                         name={namePrefix + 'citation.text'}
                         label="Citation"
                         type="text"
                         value={citationText}
                         required
                         onChange={this.onChange}
                         leftIcon={<FontIcon>book</FontIcon>}
                         disabled={disabled || !hasCitationText}
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
                         value={get(citationReference, `urls[${index}].url`, '')}
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
        </div>
    )
  }
}
CitationReferenceEditorFields.propTypes = {
  citationReference: PropTypes.object,
  /** If present, this string will be prepended to this editor's controls' ids, with an intervening "." */
  id: PropTypes.string,
  quoteId: PropTypes.string,
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
CitationReferenceEditorFields.defaultProps = {
  disabled: false,
}

export default CitationReferenceEditorFields