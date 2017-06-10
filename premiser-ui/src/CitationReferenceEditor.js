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

// import './CitationReferenceEditor.scss'

class CitationReferenceEditor extends Component {
  constructor() {
    super()
    this.state = {
      isQuoteEditedAfterMount: false
    }
    this.onPropertyChange = this.onPropertyChange.bind(this)
    this.onAddUrlClick = this.onAddUrlClick.bind(this)
    this.onDeleteUrlClick = this.onDeleteUrlClick.bind(this)
  }

  componentDidMount() {
    this.setState({
      isQuoteEditedAfterMount: false
    })
  }

  onPropertyChange(value, event) {
    const target = event.target;
    const name = target.name
    this.updateIsQuoteEditedAfterMount(value, name)
    this.props.onPropertyChange({[name]: value})
  }

  updateIsQuoteEditedAfterMount(value, name) {
    if (name === 'quote') {
      this.setState({
        isQuoteEditedAfterMount: true
      })
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
      readOnly,
    } = this.props
    const {
      isQuoteEditedAfterMount
    } = this.state

    const urls = citationReference ? citationReference.urls : []
    const namePrefix = name ? name + '.' : ''
    const idPrefix = id ? id + '.' : ''
    // const suggestionsKeyPrefix = suggestionsKey ? suggestionsKey + '.' : ''

    return (
        <div>
          <TextField
              id={idPrefix + "quote"}
              key="quote"
              name={namePrefix + "quote"}
              type="text"
              label="Quote"
              rows={2}
              className={cn({
                editedAfterMount: isQuoteEditedAfterMount,
                hasIcon: true,
                hasValue: !!citationReference.quote,
              })}
              value={citationReference.quote}
              onChange={this.onPropertyChange}
              leftIcon={<FontIcon>format_quote</FontIcon>}
              disabled={readOnly}
          />
          <TextField
              id={idPrefix + 'citation.text'}
              key="citation.text"
              name={namePrefix + 'citation.text'}
              // suggestionsKey={suggestionsKeyPrefix + 'Text'}
              type="text"
              label="Citation"
              value={citationReference.citation.text}
              required
              onChange={this.onPropertyChange}
              leftIcon={<FontIcon>book</FontIcon>}
              disabled={readOnly}
          />
          {urls.map( (url, index) =>
              <TextField
                  id={`${idPrefix}urls[${index}].url`}
                  key={`urls[${index}].url`}
                  name={`${namePrefix}urls[${index}].url`}
                  type="url"
                  label="URL"
                  value={citationReference.urls[index].url}
                  onChange={this.onPropertyChange}
                  leftIcon={<FontIcon>link</FontIcon>}
                  rightIcon={readOnly ? <div></div> : <Button icon onClick={(e) => this.onDeleteUrlClick(e, url, index)}>delete</Button>}
                  disabled={readOnly}
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
  onPropertyChange: PropTypes.func,
  onDeleteUrlClick: PropTypes.func,
  onAddUrlClick: PropTypes.func,
}

export default CitationReferenceEditor