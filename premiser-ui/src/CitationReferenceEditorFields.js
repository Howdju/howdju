import React, {Component} from 'react'
import PropTypes from 'prop-types'
import TextField from 'react-md/lib/TextFields'
import FontIcon from 'react-md/lib/FontIcons'
import Button from 'react-md/lib/Buttons/Button'
import cn from 'classnames'
import {RETURN_KEY_CODE} from "./keyCodes";
import CitationTextAutocomplete from "./CitationTextAutocomplete";
import {toErrorText} from "./modelErrorMessages";
import map from 'lodash/map'

import './CitationReferenceEditorFields.scss'

const quoteName = 'quote'

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
    }
  }

  render() {
    const {
      citationReference,
      name,
      id,
      suggestionsKey,
      readOnly,
      errors
    } = this.props
    const {
      isQuoteEditedAfterMount
    } = this.state

    const urls = citationReference.urls
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
        map(urls, () => {})

    return (
        <div>
          <TextField
              id={idPrefix + quoteName}
              key="quote"
              name={namePrefix + quoteName}
              type="text"
              label="Quote"
              rows={2}
              className={cn({
                editedAfterMount: isQuoteEditedAfterMount,
                hasIcon: true,
                hasValue: !!citationReference.quote,
              })}
              value={citationReference.quote || ''}
              onChange={this.onChange}
              leftIcon={<FontIcon>format_quote</FontIcon>}
              disabled={readOnly}
              {...quoteInputProps}
          />
          {suggestionsKey && !readOnly ?
              <CitationTextAutocomplete
                  id={idPrefix + 'citation.text'}
                  key="citation.text"
                  name={namePrefix + 'citation.text'}
                  suggestionsKey={suggestionsKeyPrefix + 'citation.text'}
                  label="Citation"
                  value={citationReference.citation.text}
                  required
                  onPropertyChange={this.onPropertyChange}
                  leftIcon={<FontIcon>book</FontIcon>}
                  disabled={readOnly}
                  onKeyDown={this.onTextInputKeyDown}
                  {...citationTextInputProps}
              /> :
              <TextField id={idPrefix + 'citation.text'}
                         name={namePrefix + 'citation.text'}
                         label="Citation"
                         type="text"
                         value={citationReference.citation.text}
                         required
                         onChange={this.onChange}
                         leftIcon={<FontIcon>book</FontIcon>}
                         disabled={readOnly}
                         {...citationTextInputProps}
              />
          }
          {map(urls, (url, index) =>
              <TextField
                  id={`${idPrefix}urls[${index}].url`}
                  key={`urls[${index}].url`}
                  name={`${namePrefix}urls[${index}].url`}
                  className="urlInput"
                  type="url"
                  label="URL"
                  value={citationReference.urls[index].url}
                  onChange={this.onChange}
                  leftIcon={<FontIcon>link</FontIcon>}
                  rightIcon={readOnly ? <div/> : <Button icon onClick={(e) => this.props.onRemoveUrl(url, index)}>delete</Button>}
                  disabled={!!url.id || readOnly}
                  onKeyDown={this.onTextInputKeyDown}
                  {...urlInputProps[index]}
              />
          )}
          <Button flat
                  className={cn({
                    addCitationReferenceUrlButton: true,
                    hidden: readOnly,
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
  citationReference: PropTypes.object.isRequired,
  /** If present, this string will be prepended to this editor's controls' ids, with an intervening "." */
  id: PropTypes.string,
  /** If present, this string will be prepended to this editor's controls' names, with an intervening "." */
  name: PropTypes.string,
  /** If present, called when the user presses enter in a text field */
  onSubmit: PropTypes.func,
  onPropertyChange: PropTypes.func.isRequired,
  onAddUrl: PropTypes.func.isRequired,
  onRemoveUrl: PropTypes.func.isRequired,
  errors: PropTypes.object,
}

export default CitationReferenceEditorFields