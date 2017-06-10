import React, {Component} from 'react'
import PropTypes from 'prop-types'
import Divider from 'react-md/lib/Dividers'
import SelectionControlGroup from 'react-md/lib/SelectionControls/SelectionControlGroup'
import Subheader from 'react-md/lib/Subheaders'
import {JustificationBasisType, JustificationPolarity} from "./models";
import text, {
  JUSTIFICATION_BASIS_TYPE_CITATION_REFERENCE,
  JUSTIFICATION_BASIS_TYPE_STATEMENT, JUSTIFICATION_POLARITY_NEGATIVE,
  JUSTIFICATION_POLARITY_POSITIVE
} from "./texts";

import './JustificationEditor.scss'
import CitationReferenceEditor from "./CitationReferenceEditor";
import StatementEditor from "./StatementEditor";


const statementName = 'basis.statement'
const citationReferenceName = "basis.citationReference"

class JustificationEditor extends Component {

  constructor() {
    super()

    this.onPropertyChange = this.onPropertyChange.bind(this)
    this.onChange = this.onChange.bind(this)
  }

  onChange(value, event) {
    const name = event.target.name
    this.props.onPropertyChange({[name]: value})
  }

  onPropertyChange(change) {
    this.props.onPropertyChange(change)
  }

  render() {
    const {
      justification,
      name,
      id,
      readOnlyBasis,
      suggestionsKey,
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

    const namePrefix = name ? name + '.' : ''
    const idPrefix = id ? id + '.' : ''
    const suggestionsKeyPrefix = suggestionsKey ? suggestionsKey + '.' : ''

    const statementComponents = [
      <Subheader primary
                 primaryText="Statement information"
                 component="div"
                 key="statementSubheader"
      />,
      <StatementEditor statement={justification.basis}
                       key="statementEditor"
                       id={idPrefix + statementName}
                       name={namePrefix + statementName}
                       suggestionsKey={suggestionsKeyPrefix + statementName}
                       onPropertyChange={this.onPropertyChange}
                       readOnly={readOnlyBasis}
      />
    ]
    const citationReferenceComponents =  [
      <Subheader primary
                 primaryText="Citation information"
                 component="div"
                 key="citationReferenceSubheader"
      />,
      <CitationReferenceEditor citationReference={justification.basis.citationReference}
                               id={idPrefix + citationReferenceName}
                               key={citationReferenceName}
                               name={namePrefix + citationReferenceName}
                               suggestionsKey={suggestionsKeyPrefix + citationReferenceName}
                               onPropertyChange={this.props.onPropertyChange}
                               onAddUrlClick={this.props.onAddUrlClick}
                               onDeleteUrlClick={this.props.onDeleteUrlClick}
                               readOnly={readOnlyBasis}
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
              id={idPrefix + "polarity"}
              name={namePrefix + "polarity"}
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
              id={idPrefix + "basis.type"}
              name={namePrefix + "basis.type"}
              type="radio"
              value={justification.basis.type}
              onChange={this.onChange}
              controls={basisTypeControls}
              disabled={readOnlyBasis}
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
  justification: PropTypes.object.isRequired,
  /** If present, this string will be prepended to this editor's controls' ids, with an intervening "." */
  id: PropTypes.string,
  /** If present, this string will be prepended to this editor's controls' names, with an intervening "." */
  name: PropTypes.string,
  /** If present, this string will be prepended to this editor's autocomplete's suggestionKeys, with an intervening "." */
  suggestionsKey: PropTypes.string,
  onPropertyChange: PropTypes.func.isRequired,
  onDeleteUrlClick: PropTypes.func.isRequired,
  onAddUrlClick: PropTypes.func.isRequired,
  readOnlyBasis: PropTypes.bool,
}
JustificationEditor.defaultProps = {
  readOnlyBasis: false,
}

export default JustificationEditor