import React, {Component} from 'react'
import PropTypes from 'prop-types'
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
import CitationReferenceEditor from "./CitationReferenceEditor";

const statementTextName = 'basis.statement.text'

class JustificationEditor extends Component {

  constructor() {
    super()

    this.onPropertyChange = this.onPropertyChange.bind(this)
    this.onChange = this.onChange.bind(this)
    this.onStatementBasisTextAutocomplete = this.onStatementBasisTextAutocomplete.bind(this)
  }

  onChange(value, event) {
    const name = event.target.name
    this.props.onPropertyChange({[name]: value})
  }

  onPropertyChange(change) {
    this.props.onPropertyChange(change)
  }

  onStatementBasisTextAutocomplete(text, index) {
    this.props.onPropertyChange({[statementTextName]: text})
  }

  render() {
    const {
      justification,
    } = this.props

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

    const statementComponents = [
      <Subheader primary
                 primaryText="Statement information"
                 component="div"
                 key="statementSubheader"
      />,
      <StatementTextAutocomplete
          id={statementTextName}
          key={statementTextName}
          name={statementTextName}
          label="Statement"
          required
          leftIcon={<FontIcon>text_fields</FontIcon>}
          value={justification.basis.statement.text}
          suggestionsKey={suggestionKeys.justificationEditor}
          onPropertyChange={this.onPropertyChange}
          onAutocomplete={this.onStatementBasisTextAutocomplete}
      />
    ]
    const citationReferenceComponents =  [
      <Subheader primary
                 primaryText="Citation information"
                 component="div"
                 key="citationReferenceSubheader"
      />,
      <CitationReferenceEditor citationReference={justification.basis.citationReference}
                               id="basis.citationReference"
                               name="basis.citationReference"
                               key="basis.citationReference"
                               onPropertyChange={this.props.onPropertyChange}
                               onAddUrlClick={this.props.onAddUrlClick}
                               onDeleteUrlClick={this.props.onDeleteUrlClick}
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
              onChange={this.onChange}
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
              onChange={this.onChange}
              controls={basisTypeControls}
          />
          <Divider />
          {justification.basis.type === JustificationBasisType.CITATION_REFERENCE ?
              citationReferenceComponents:
              statementComponents
          }
        </div>
    )
  }
}
JustificationEditor.propTypes = {
  justification: PropTypes.object,
  onPropertyChange: PropTypes.func,
  onDeleteUrlClick: PropTypes.func,
  onAddUrlClick: PropTypes.func,
}

export default JustificationEditor