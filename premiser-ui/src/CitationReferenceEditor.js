import React, {Component} from 'react'
import PropTypes from 'prop-types'
import TextField from 'react-md/lib/TextFields'
import FontIcon from 'react-md/lib/FontIcons'
import Button from 'react-md/lib/Buttons'
import cn from 'classnames'
import text, {
  JUSTIFICATION_BASIS_TYPE_CITATION_REFERENCE,
  JUSTIFICATION_BASIS_TYPE_STATEMENT, JUSTIFICATION_POLARITY_NEGATIVE,
  JUSTIFICATION_POLARITY_POSITIVE
} from "./texts";
import { suggestionKeys } from './autocompleter'
import {RETURN_KEY_CODE} from "./keyCodes";
import CitationTextAutocomplete from "./CitationTextAutocomplete";

const quoteName = 'quote'

class CitationReferenceEditor extends Component {
  constructor() {
    super()
    this.state = {
      isQuoteEditedAfterMount: false
    }
    this.onChange = this.onChange.bind(this)
    this.onPropertyChange = this.onPropertyChange.bind(this)
    this.onTextInputKeyDown = this.onTextInputKeyDown.bind(this)
    this.onAddUrlClick = this.onAddUrlClick.bind(this)
    this.onDeleteUrlClick = this.onDeleteUrlClick.bind(this)
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
      event.preventDefault()
      this.props.onSubmit()
    }
  }

  onAddUrlClick(e) {
    e.preventDefault()
    this.props.onAddUrlClick()
  }

  onDeleteUrlClick(e, url, index) {
    e.preventDefault()
    this.props.onDeleteUrlClick(url, index)
  }

  render() {
    const {
      citationReference,
      name,
      id,
      suggestionsKey,
      readOnly,
    } = this.props
    const {
      isQuoteEditedAfterMount
    } = this.state

    const urls = citationReference ? citationReference.urls : []
    const namePrefix = name ? name + '.' : ''
    const idPrefix = id ? id + '.' : ''
    const suggestionsKeyPrefix = suggestionsKey ? suggestionsKey + '.' : ''

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
              value={citationReference.quote}
              onChange={this.onChange}
              leftIcon={<FontIcon>format_quote</FontIcon>}
              disabled={readOnly}
          />
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
          />
          {urls.map( (url, index) =>
              <TextField
                  id={`${idPrefix}urls[${index}].url`}
                  key={`urls[${index}].url`}
                  name={`${namePrefix}urls[${index}].url`}
                  type="url"
                  label="URL"
                  value={citationReference.urls[index].url}
                  onChange={this.onChange}
                  leftIcon={<FontIcon>link</FontIcon>}
                  rightIcon={readOnly ? <div/> : <Button icon onClick={(e) => this.onDeleteUrlClick(e, url, index)}>delete</Button>}
                  disabled={readOnly}
                  onKeyDown={this.onTextInputKeyDown}
              />
          )}
          <Button flat
                  className={cn({
                    deleteCitationReferenceUrlButton: true,
                    hidden: readOnly,
                  })}
                  key="addUrlButton"
                  label="Add URL"
                  onClick={this.onAddUrlClick}
          >add</Button>
        </div>
    )
  }
}
CitationReferenceEditor.propTypes = {
  citationReference: PropTypes.object,
  /** If present, this string will be prepended to this editor's controls' ids, with an intervening "." */
  id: PropTypes.string,
  /** If present, this string will be prepended to this editor's controls' names, with an intervening "." */
  name: PropTypes.string,
  onSubmit: PropTypes.func,
  onPropertyChange: PropTypes.func,
  onDeleteUrlClick: PropTypes.func,
  onAddUrlClick: PropTypes.func,
}

export default CitationReferenceEditor