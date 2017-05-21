import React, {Component} from 'react'
import Divider from 'react-md/lib/Dividers'
import TextField from 'react-md/lib/TextFields'
import SelectionControlGroup from 'react-md/lib/SelectionControls/SelectionControlGroup'
import FontIcon from 'react-md/lib/FontIcons'
import Subheader from 'react-md/lib/Subheaders'
import Button from 'react-md/lib/Buttons'
import {JustificationBasisType, JustificationPolarity} from "./models";
import cn from 'classnames'
import text, {
  JUSTIFICATION_BASIS_TYPE_CITATION_REFERENCE,
  JUSTIFICATION_BASIS_TYPE_STATEMENT, JUSTIFICATION_POLARITY_NEGATIVE,
  JUSTIFICATION_POLARITY_POSITIVE
} from "./texts";
import StatementTextAutocomplete from './StatementTextAutocomplete'
import { suggestionKeys } from './autocompleter'

import './JustificationEditor.scss'

class JustificationEditor extends Component {
  constructor() {
    super()
    this.state = {
      isQuoteEditedAfterMount: false
    }
    this.onPropertyChange = this.onPropertyChange.bind(this)
    this.onAddUrlClick = this.onAddUrlClick.bind(this)
    this.onStatementTextAutocomplete = this.onStatementTextAutocomplete.bind(this)
  }

  onPropertyChange(value, event) {
    const target = event.target;
    const name = target.name
    this.updateIsQuoteEditedAfterMount(value, name)
    // The name will be sent to lodash.set, so it will be traversed on the new justification
    this.props.onPropertyChange({[name]: value})
  }

  updateIsQuoteEditedAfterMount(value, name) {
    if (name === 'basis.citationReference.quote') {
      this.setState({
        isQuoteEditedAfterMount: true
      })
    } else if (name === 'basis.type' && value === JustificationBasisType.STATEMENT) {
      this.setState({
        // The textarea will be unmounted, so reset the flag
        isQuoteEditedAfterMount: false
      })
    }
  }

  onStatementTextAutocomplete(text, index) {
    this.props.onPropertyChange({'basis.statement.text': text})
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
      justification,
    } = this.props
    const {
      isQuoteEditedAfterMount
    } = this.state

    const polarityControls = [{
      value: JustificationPolarity.POSITIVE,
      label: text(JUSTIFICATION_POLARITY_POSITIVE),
    }, {
      value: JustificationPolarity.NEGATIVE,
      label: text(JUSTIFICATION_POLARITY_NEGATIVE),
    }];
    const basisTypeControls = [{
      value: JustificationBasisType.STATEMENT,
      label: text(JUSTIFICATION_BASIS_TYPE_STATEMENT),
    }, {
      value: JustificationBasisType.CITATION_REFERENCE,
      label: text(JUSTIFICATION_BASIS_TYPE_CITATION_REFERENCE),
    }];

    const urls = justification.basis.citationReference ?
        justification.basis.citationReference.urls :
        []

    let citationReferenceInputs = [
      <Subheader primary
                 primaryText="Citation information"
                 component="div"
                 key="citationSubheader"
      />,
      <TextField
          id="basis.citationReference.citation.text"
          key="basis.citationReference.citation.text"
          type="text"
          name="basis.citationReference.citation.text"
          label="Citation"
          value={justification.basis.citationReference.citation.text}
          required
          onChange={this.onPropertyChange}
          leftIcon={<FontIcon>book</FontIcon>}
      />,
      <TextField
          id="basis.citationReference.quote"
          key="basis.citationReference.quote"
          type="text"
          name="basis.citationReference.quote"
          label="Quote"
          rows={2}
          className={cn({
            editedAfterMount: isQuoteEditedAfterMount,
            hasIcon: true,
            hasValue: !!justification.basis.citationReference.quote,
          })}
          value={justification.basis.citationReference.quote}
          onChange={this.onPropertyChange}
          leftIcon={<FontIcon>format_quote</FontIcon>}
      />
    ]
    citationReferenceInputs = citationReferenceInputs.concat(urls.map( (url, index) =>
        <TextField
            id={`basis.citationReference.urls[${index}].url`}
            key={`basis.citationReference.urls[${index}].url`}
            type="url"
            name={`basis.citationReference.urls[${index}].url`}
            label="URL"
            value={justification.basis.citationReference.urls[index].url}
            onChange={this.onPropertyChange}
            leftIcon={<FontIcon>link</FontIcon>}
            rightIcon={<Button icon onClick={(e) => this.onDeleteUrlClick(e, url, index)}>delete</Button>}
        />,
    ))
    citationReferenceInputs.push(
        <Button flat
                key="addUrlButton"
                label="Add URL"
                className="deleteCitationReferenceUrlButton"
                onClick={this.onAddUrlClick}
        >add</Button>
    )

    const statementInputs = [
      <Subheader primary
                 primaryText="Statement information"
                 component="div"
                 key="statementSubheader"
      />,
      <StatementTextAutocomplete
          id="basis.statement.text"
          key="basis.statement.text"
          name="basis.statement.text"
          label="Statement"
          required
          leftIcon={<FontIcon>text_fields</FontIcon>}
          value={justification.basis.statement.text}
          suggestionsKey={suggestionKeys.justificationEditor}
          onChange={this.onPropertyChange}
          onAutocomplete={this.onStatementTextAutocomplete}
      />
    ]

    return (
        <div>
          <Subheader primary
                     primaryText="Polarity"
                     component="div"
          />
          <SelectionControlGroup
              inline
              id="polarity"
              name="polarity"
              type="radio"
              value={justification.polarity}
              onChange={this.onPropertyChange}
              controls={polarityControls}
          />
          <Divider />
          <Subheader primary
                     primaryText="Basis type"
                     component="div"
          />
          <SelectionControlGroup
              inline
              id="basis.type"
              name="basis.type"
              type="radio"
              value={justification.basis.type}
              onChange={this.onPropertyChange}
              controls={basisTypeControls}
          />
          <Divider />
          {justification.basis.type === JustificationBasisType.CITATION_REFERENCE ?
              citationReferenceInputs :
              statementInputs
          }
        </div>
    )
  }
}

export default JustificationEditor