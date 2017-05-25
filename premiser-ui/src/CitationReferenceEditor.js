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

    const qualifiedName = this.props.name ? [this.props.name, name].join('.') : name
    // The name will be sent to lodash.set, so it will be traversed on the new justification
    this.props.onPropertyChange({[qualifiedName]: value})
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
    } = this.props
    const {
      isQuoteEditedAfterMount
    } = this.state

    const urls = citationReference ? citationReference.urls : []

    return (
        <div>
          <TextField
              id="citation.text"
              key="citation.text"
              name="citation.text"
              type="text"
              label="Citation"
              value={citationReference.citation.text}
              required
              onChange={this.onPropertyChange}
              leftIcon={<FontIcon>book</FontIcon>}
          />
          <TextField
              id="quote"
              key="quote"
              name="quote"
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
          />
          {urls.map( (url, index) =>
              <TextField
                  id={`urls[${index}].url`}
                  key={`urls[${index}].url`}
                  name={`urls[${index}].url`}
                  type="url"
                  label="URL"
                  value={citationReference.urls[index].url}
                  onChange={this.onPropertyChange}
                  leftIcon={<FontIcon>link</FontIcon>}
                  rightIcon={<Button icon onClick={(e) => this.onDeleteUrlClick(e, url, index)}>delete</Button>}
              />
          )}
          <Button flat
                  key="addUrlButton"
                  label="Add URL"
                  className="deleteCitationReferenceUrlButton"
                  onClick={this.onAddUrlClick}
          >add</Button>
        </div>
    )
  }
}
CitationReferenceEditor.propTypes = {
  citationReference: PropTypes.object,
  /** If present, this string will be prepended to this editor's controls' names, with an intervening "." when
   * the onPropertyChange prop handler is called
   */
  name: PropTypes.string,
  onPropertyChange: PropTypes.func,
  onDeleteUrlClick: PropTypes.func,
  onAddUrlClick: PropTypes.func,
}

export default CitationReferenceEditor