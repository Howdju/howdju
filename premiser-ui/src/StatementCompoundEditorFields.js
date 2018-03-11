import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {Button, FontIcon} from 'react-md'
import map from 'lodash/map'
import get from 'lodash/get'

import {toErrorText} from "./modelErrorMessages"
import ErrorMessages from './ErrorMessages'

import SingleLineTextField from './SingleLineTextField'
import StatementTextAutocomplete from "./StatementTextAutocomplete"
import {
  combineNames,
  combineIds,
  combineSuggestionsKeys
} from './viewModels'


const atomsName = 'atoms'

class StatementCompoundEditorFields extends Component {

  render() {
    const {
      statementCompound,
      name,
      id,
      suggestionsKey,
      disabled,
      errors,
      onAddStatementCompoundAtom,
      onRemoveStatementCompoundAtom,
      onPropertyChange,
      onSubmit,
    } = this.props

    const atoms = get(statementCompound, atomsName, '')

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
          const atomStatementTextName = `atoms[${index}].entity.text` // TODO .entity or .statement?
          const value = get(statementCompound, atomStatementTextName, '')
          const leftIcon = <FontIcon>short_text</FontIcon>
          const rightIcon = disabled ?
            <div/> :
            <div>
              <Button icon onClick={e => onAddStatementCompoundAtom(index)}>add</Button>
              <Button icon onClick={e => onRemoveStatementCompoundAtom(atom, index)}>delete</Button>
            </div>

          const inputProps = {
            id: combineIds(id, atomStatementTextName),
            key: atomStatementTextName,
            name: combineNames(name, atomStatementTextName),
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
            <StatementTextAutocomplete
              {...inputProps}
              {...atomsErrorsInputProps[index]}
              suggestionsKey={combineSuggestionsKeys(suggestionsKey, atomStatementTextName)}
            /> :
            <SingleLineTextField
              {...inputProps}
              {...atomsErrorsInputProps[index]}
            />
        })}
        <Button
          flat
          className="add-button"
          key="addStatementCompoundAtomButton"
          children="Add Statement"
          onClick={e => onAddStatementCompoundAtom(atoms.length)}
        >add</Button>
        {hasErrors && errors.modelErrors && (
          <ErrorMessages errors={errors.modelErrors} />
        )}
      </div>
    )
  }
}
StatementCompoundEditorFields.propTypes = {
  statementCompound: PropTypes.object,
  /** If present, this string will be prepended to this editor's controls' ids, with an intervening "." */
  id: PropTypes.string,
  /** If present, this string will be prepended to this editor's controls' names, with an intervening "." */
  name: PropTypes.string,
  /** If present, called when the user presses enter in a text field */
  onPropertyChange: PropTypes.func.isRequired,
  onAddStatementCompoundAtom: PropTypes.func.isRequired,
  onRemoveStatementCompoundAtom: PropTypes.func.isRequired,
  errors: PropTypes.object,
  /** Whether to disable the inputs */
  disabled: PropTypes.bool,
}
StatementCompoundEditorFields.defaultProps = {
  disabled: false,
}

export default StatementCompoundEditorFields