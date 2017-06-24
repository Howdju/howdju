import React, {Component} from 'react'
import PropTypes from 'prop-types'
import Divider from 'react-md/lib/Dividers'
import SelectionControlGroup from 'react-md/lib/SelectionControls/SelectionControlGroup'
import Subheader from 'react-md/lib/Subheaders'
import get from 'lodash/get'
import cn from 'classnames'

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
      basisStatementTextId,
      basisCitationReferenceQuoteId,
      readOnlyBasis,
      disabled,
      suggestionsKey,
      onSubmit,
      onPropertyChange,
      onAddUrl,
      onRemoveUrl,
      errors,
      onKeyDown,
    } = this.props

    const namePrefix = name ? name + '.' : ''
    const idPrefix = id ? id + '.' : ''
    const suggestionsKeyPrefix = suggestionsKey ? suggestionsKey + '.' : ''

    const statementErrors = errors && errors.fieldErrors.basis.fieldErrors.statement
    const citationReferenceErrors = errors && errors.fieldErrors.basis.fieldErrors.citationReference

    const basisStatement = get(newJustification, statementName)
    const basisCitationReference = get(newJustification, citationReferenceName)
    const basisType = get(newJustification, 'basis.type')
    const isStatementBased = basisType === JustificationBasisType.STATEMENT
    const isCitationReferenceBased = basisType === JustificationBasisType.CITATION_REFERENCE

    const statementComponents = [
      <Subheader primary
                 primaryText="Statement information"
                 component="div"
                 key="statementSubheader"
      />,
      <StatementEditorFields statement={basisStatement}
                             key="statementEditorFields"
                             textId={basisStatementTextId}
                             name={namePrefix + statementName}
                             suggestionsKey={suggestionsKeyPrefix + statementName}
                             onPropertyChange={onPropertyChange}
                             disabled={readOnlyBasis || disabled}
                             errors={statementErrors}
                             onKeyDown={onKeyDown}
      />
    ]
    const citationReferenceComponents =  [
      <Subheader primary
                 primaryText="Citation information"
                 component="div"
                 key="citationReferenceSubheader"
      />,
      <CitationReferenceEditorFields citationReference={basisCitationReference}
                                     id={idPrefix + citationReferenceName}
                                     quoteId={basisCitationReferenceQuoteId}
                                     key={citationReferenceName}
                                     name={namePrefix + citationReferenceName}
                                     suggestionsKey={suggestionsKeyPrefix + citationReferenceName}
                                     onPropertyChange={onPropertyChange}
                                     onAddUrl={onAddUrl}
                                     onRemoveUrl={onRemoveUrl}
                                     disabled={readOnlyBasis || disabled}
                                     onSubmit={onSubmit}
                                     errors={citationReferenceErrors}
                                     onKeyDown={onKeyDown}
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
              value={get(newJustification, 'polarity')}
              onChange={this.onChange}
              controls={polarityControls}
              disabled={disabled}
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
              value={get(newJustification, 'basis.type')}
              onChange={this.onChange}
              controls={basisTypeControls}
              disabled={readOnlyBasis || disabled}
          />
          <Divider />
          {isStatementBased && statementComponents}
          {isCitationReferenceBased && citationReferenceComponents}
        </div>
    )
  }
}
NewJustificationEditorFields.propTypes = {
  newJustification: PropTypes.object,
  /** If present, this string will be prepended to this editor's controls' ids, with an intervening "." */
  id: PropTypes.string,
  basisStatementTextId: PropTypes.string.isRequired,
  basisCitationReferenceQuoteId: PropTypes.string,
  /** If present, this string will be prepended to this editor's controls' names, with an intervening "." */
  name: PropTypes.string,
  /** If present, this string will be prepended to this editor's autocomplete's suggestionKeys, with an intervening "." */
  suggestionsKey: PropTypes.string,
  onPropertyChange: PropTypes.func.isRequired,
  onRemoveUrl: PropTypes.func.isRequired,
  onAddUrl: PropTypes.func.isRequired,
  /** Disables the basis inputs, but the polarity is still active */
  readOnlyBasis: PropTypes.bool,
  disabled: PropTypes.bool,
  onSubmit: PropTypes.func,
  errors: PropTypes.object,
  /** Passed to subcontrols */
  onKeyDown: PropTypes.func,
}
NewJustificationEditorFields.defaultProps = {
  readOnlyBasis: false,
}

export default NewJustificationEditorFields