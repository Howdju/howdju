import React, {Component} from 'react'
import PropTypes from 'prop-types'
import FontIcon from 'react-md/lib/FontIcons'
import Button from 'react-md/lib/Buttons/Button'
import map from 'lodash/map'
import get from 'lodash/get'

import {toErrorText} from "./modelErrorMessages"
import ErrorMessages from './ErrorMessages'

import SingleLineTextField from './SingleLineTextField'
import StatementTextAutocomplete from "./StatementTextAutocomplete"

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

    const namePrefix = name ? name + '.' : ''
    const idPrefix = id ? id + '.' : ''
    const suggestionsKeyPrefix = suggestionsKey ? suggestionsKey + '.' : ''

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
          const name = `atoms[${index}].entity.text`
          const value = get(statementCompound, name, '')
          const leftIcon = <FontIcon>short_text</FontIcon>
          const rightIcon = disabled ?
            <div/> :
            <div>
              <Button icon onClick={e => onAddStatementCompoundAtom(index)}>add</Button>
              <Button icon onClick={e => onRemoveStatementCompoundAtom(atom, index)}>delete</Button>
            </div>

          const inputProps = {
            id: idPrefix + name,
            key: name,
            name: namePrefix + name,
            value,
            label: "Text",
            leftIcon,
            rightIcon,
            disabled,
            onPropertyChange,
            onSubmit,
          }
          return suggestionsKey && !disabled ?
            <StatementTextAutocomplete
              {...inputProps}
              {...atomsErrorsInputProps[index]}
              suggestionsKey={suggestionsKeyPrefix + name}
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
          label="Add Statement"
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