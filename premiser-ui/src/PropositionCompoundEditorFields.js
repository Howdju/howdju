import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {Button, FontIcon} from 'react-md'
import map from 'lodash/map'
import get from 'lodash/get'

import {toErrorText} from "./modelErrorMessages"
import ErrorMessages from './ErrorMessages'

import SingleLineTextField from './SingleLineTextField'
import PropositionTextAutocomplete from "./PropositionTextAutocomplete"
import {
  combineNames,
  combineIds,
  combineSuggestionsKeys
} from './viewModels'


const atomsName = 'atoms'

class PropositionCompoundEditorFields extends Component {

  render() {
    const {
      propositionCompound,
      name,
      id,
      suggestionsKey,
      disabled,
      errors,
      onAddPropositionCompoundAtom,
      onRemovePropositionCompoundAtom,
      onPropertyChange,
      onSubmit,
    } = this.props

    const atoms = get(propositionCompound, atomsName, '')

    const hasErrors = errors && errors.hasErrors
    const atomsErrorsInputProps = hasErrors ?
      map(errors.fieldErrors.atoms.itemErrors, atomError => atomError.fieldErrors.entity.fieldErrors.text.length > 0 ?
        {error: true, errorText: toErrorText(atomError.fieldErrors.entity.fieldErrors.text)} :
        {}
      ) :
      map(atoms, () => null)

    return (
      <div>
        {map(atoms, (atom, index) => {
          const atomPropositionTextName = `atoms[${index}].entity.text` // TODO .entity or .proposition?
          const value = get(propositionCompound, atomPropositionTextName, '')
          const leftIcon = <FontIcon>short_text</FontIcon>
          const rightIcon = disabled ?
            <div/> :
            <div>
              <Button icon onClick={e => onAddPropositionCompoundAtom(index)}>add</Button>
              <Button icon onClick={e => onRemovePropositionCompoundAtom(atom, index)}>delete</Button>
            </div>

          const inputProps = {
            id: combineIds(id, atomPropositionTextName),
            key: atomPropositionTextName,
            name: combineNames(name, atomPropositionTextName),
            value,
            label: "Text",
            leftIcon,
            leftIconStateful: true,
            rightIcon,
            rightIconStateful: false,
            disabled,
            onPropertyChange,
            onSubmit,
          }
          return suggestionsKey && !disabled ?
            <PropositionTextAutocomplete
              {...inputProps}
              {...atomsErrorsInputProps[index]}
              suggestionsKey={combineSuggestionsKeys(suggestionsKey, atomPropositionTextName)}
            /> :
            <SingleLineTextField
              {...inputProps}
              {...atomsErrorsInputProps[index]}
            />
        })}
        <Button
          flat
          className="add-button"
          key="addPropositionCompoundAtomButton"
          children="Add Proposition"
          onClick={e => onAddPropositionCompoundAtom(atoms.length)}
        >add</Button>
        {hasErrors && errors.modelErrors && (
          <ErrorMessages errors={errors.modelErrors} />
        )}
      </div>
    )
  }
}
PropositionCompoundEditorFields.propTypes = {
  propositionCompound: PropTypes.object,
  /** If present, this string will be prepended to this editor's controls' ids, with an intervening "." */
  id: PropTypes.string,
  /** If present, this string will be prepended to this editor's controls' names, with an intervening "." */
  name: PropTypes.string,
  /** If present, called when the user presses enter in a text field */
  onPropertyChange: PropTypes.func.isRequired,
  onAddPropositionCompoundAtom: PropTypes.func.isRequired,
  onRemovePropositionCompoundAtom: PropTypes.func.isRequired,
  errors: PropTypes.object,
  /** Whether to disable the inputs */
  disabled: PropTypes.bool,
}
PropositionCompoundEditorFields.defaultProps = {
  disabled: false,
}

export default PropositionCompoundEditorFields