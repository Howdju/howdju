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
import CitationReferenceEditorFields from "./CitationReferenceEditorFields";
import StatementEditorFields from "./StatementEditorFields";

import './NewJustificationEditorFields.scss'


const statementName = 'basis.statement'
const citationReferenceName = "basis.citationReference"

const polarityControls = [{
  value: JustificationPolarity.POSITIVE,
  label: text(JUSTIFICATION_POLARITY_POSITIVE),
}, {
  value: JustificationPolarity.NEGATIVE,
  label: text(JUSTIFICATION_POLARITY_NEGATIVE),
}]
const basisTypeControls = [{
  value: JustificationBasisType.STATEMENT,
  label: text(JUSTIFICATION_BASIS_TYPE_STATEMENT),
}, {
  value: JustificationBasisType.CITATION_REFERENCE,
  label: text(JUSTIFICATION_BASIS_TYPE_CITATION_REFERENCE),
}]

class NewJustificationEditorFields extends Component {

  constructor() {
    super()

    this.onChange = this.onChange.bind(this)
  }

  onChange(value, event) {
    const name = event.target.name
    this.props.onPropertyChange({[name]: value})
  }

  render() {
    const {
      newJustification,
      name,
      id,
      readOnlyBasis,
      suggestionsKey,
      onSubmit,
      onPropertyChange,
      onAddUrl,
      onRemoveUrl,
      errors,
    } = this.props

    const namePrefix = name ? name + '.' : ''
    const idPrefix = id ? id + '.' : ''
    const suggestionsKeyPrefix = suggestionsKey ? suggestionsKey + '.' : ''

    const statementErrors = errors && errors.fieldErrors.basis.fieldErrors.statement
    const citationReferenceErrors = errors && errors.fieldErrors.basis.fieldErrors.citationReference

    const statementComponents = [
      <Subheader primary
                 primaryText="Statement information"
                 component="div"
                 key="statementSubheader"
      />,
      <StatementEditorFields statement={newJustification.basis.statement}
                             key="statementEditorFields"
                             id={idPrefix + statementName}
                             name={namePrefix + statementName}
                             suggestionsKey={suggestionsKeyPrefix + statementName}
                             onPropertyChange={onPropertyChange}
                             readOnly={readOnlyBasis}
                             errors={statementErrors}
      />
    ]
    const citationReferenceComponents =  [
      <Subheader primary
                 primaryText="Citation information"
                 component="div"
                 key="citationReferenceSubheader"
      />,
      <CitationReferenceEditorFields citationReference={newJustification.basis.citationReference}
                                     id={idPrefix + citationReferenceName}
                                     key={citationReferenceName}
                                     name={namePrefix + citationReferenceName}
                                     suggestionsKey={suggestionsKeyPrefix + citationReferenceName}
                                     onPropertyChange={onPropertyChange}
                                     onAddUrl={onAddUrl}
                                     onRemoveUrl={onRemoveUrl}
                                     readOnly={readOnlyBasis}
                                     onSubmit={onSubmit}
                                     errors={citationReferenceErrors}
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
              value={newJustification.polarity}
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
              value={newJustification.basis.type}
              onChange={this.onChange}
              controls={basisTypeControls}
              disabled={readOnlyBasis}
          />
          <Divider />
          {newJustification.basis.type === JustificationBasisType.CITATION_REFERENCE ?
              citationReferenceComponents:
              statementComponents
          }
        </div>
    )
  }
}
NewJustificationEditorFields.propTypes = {
  newJustification: PropTypes.object.isRequired,
  /** If present, this string will be prepended to this editor's controls' ids, with an intervening "." */
  id: PropTypes.string,
  /** If present, this string will be prepended to this editor's controls' names, with an intervening "." */
  name: PropTypes.string,
  /** If present, this string will be prepended to this editor's autocomplete's suggestionKeys, with an intervening "." */
  suggestionsKey: PropTypes.string,
  onPropertyChange: PropTypes.func.isRequired,
  onRemoveUrl: PropTypes.func.isRequired,
  onAddUrl: PropTypes.func.isRequired,
  readOnlyBasis: PropTypes.bool,
  onSubmit: PropTypes.func,
  errors: PropTypes.object,
}
NewJustificationEditorFields.defaultProps = {
  readOnlyBasis: false,
}

export default NewJustificationEditorFields