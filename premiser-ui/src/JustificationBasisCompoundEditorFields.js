import React, {Component} from 'react'
import PropTypes from 'prop-types'
import TextField from 'react-md/lib/TextFields/TextField'
import FontIcon from 'react-md/lib/FontIcons'
import Button from 'react-md/lib/Buttons/Button'
import cn from 'classnames'
import map from 'lodash/map'
import get from 'lodash/get'

import {
  JustificationBasisCompoundAtomType,
} from 'howdju-common'

import {RETURN_KEY_CODE} from "./keyCodes"
import {toErrorText} from "./modelErrorMessages"
import ErrorMessages from './ErrorMessages'
import StatementTextAutocomplete from "./StatementTextAutocomplete"
import {logger} from './logger'

import './WritQuoteEditorFields.scss'

const atomsName = 'atoms'
const statementTextName = 'text'

const makeStatementAtomFields = (atom, name, id, suggestionsKey, atomErrorProps, rightIcon, disabled) => {
  const value = get(atom, ['entity', statementTextName], '')
  const leftIcon = <FontIcon>short_text</FontIcon>
  const idPrefix = id + '.'
  const namePrefix = name + '.'
  const suggestionsKeyPrefix = suggestionsKey + '.'
  return suggestionsKey && !disabled ?
    <StatementTextAutocomplete {...atomErrorProps}
                               id={idPrefix + statementTextName}
                               key={idPrefix + statementTextName}
                               name={namePrefix + statementTextName}
                               type="text"
                               label="Text"
                               value={value}
                               suggestionsKey={suggestionsKeyPrefix + name}
                               onPropertyChange={this.onPropertyChange}
                               leftIcon={leftIcon}
                               rightIcon={rightIcon}
                               onKeyDown={this.onTextInputKeyDown}
    /> :
    <TextField {...atomErrorProps}
               id={idPrefix + statementTextName}
               key={idPrefix + statementTextName}
               name={namePrefix + statementTextName}
               type="text"
               label="Text"
               value={value}
               onChange={this.onChange}
               leftIcon={leftIcon}
               rightIcon={rightIcon}
               disabled={disabled}
               onKeyDown={this.onTextInputKeyDown}
    />
}

const makeParaphraseAtomFields = () => {}

const makeAtomFields = (atom, index, name, id, suggestionsKeyPrefix, atomsErrorProps, onAddAtom, onRemoveAtom, disabled) => {

  const idPrefix = id + `.atoms[${index}]`
  const namePrefix = name + `.atoms[${index}]`
  const atomErrorProps = atomsErrorProps[index]

  const rightIcon = disabled ?
    <div/> :
    <div>
      <Button icon onClick={e => onAddAtom(index)}>add</Button>
      <Button icon onClick={e => onRemoveAtom(atom, index)}>delete</Button>
    </div>

  switch (atom.type) {
    case JustificationBasisCompoundAtomType.STATEMENT: {
      return makeStatementAtomFields(atom, namePrefix, idPrefix, suggestionsKeyPrefix, atomErrorProps, rightIcon, disabled)
    }
    case JustificationBasisCompoundAtomType.SOURCE_EXCERPT_PARAPHRASE: {
      return makeParaphraseAtomFields(atom, namePrefix, idPrefix, suggestionsKeyPrefix, atomErrorProps, rightIcon, disabled)
    }
    default:
      logger.error(`Unsupported JustificationBasisCompoundAtomType: ${atom.type}`)
      return
  }
}

export default class BasisCompoundEditorFields extends Component {

  onChange = (value, event) => {
    const target = event.target
    const name = target.name
    this.props.onPropertyChange({[name]: value})
  }

  onPropertyChange = (properties) => {
    this.props.onPropertyChange(properties)
  }

  onTextInputKeyDown = (event) => {
    if (event.keyCode === RETURN_KEY_CODE && this.props.onSubmit) {
      this.props.onSubmit(event)
    } else if (this.props.onKeyDown) {
      this.props.onKeyDown(event)
    }
  }

  render() {
    const {
      justificationBasisCompound,
      name,
      id,
      suggestionsKey,
      onAddAtom,
      onRemoveAtom,
      disabled,
      errors,
    } = this.props

    const namePrefix = name ? name + '.' : ''
    const idPrefix = id ? id + '.' : ''
    const suggestionsKeyPrefix = suggestionsKey ? suggestionsKey + '.' : ''

    const atoms = get(justificationBasisCompound, atomsName, [])

    const hasErrors = errors && errors.hasErrors
    const atomErrorProps = hasErrors ?
      map(errors.fieldErrors.atoms.itemErrors, atomError => atomError.fieldErrors.statement.fieldErrors.text.length > 0 ?
          {error: true, errorText: toErrorText(atomError.fieldErrors.statement.fieldErrors.text)} :
          {}
      ) :
      map(atoms, () => null)
    const atomComponents = map(atoms, (atom, index) =>
      makeAtomFields(atom, index, namePrefix, idPrefix, suggestionsKeyPrefix, atomErrorProps, onAddAtom, onRemoveAtom, disabled)
    )

    return (
      <div>
        {atomComponents}
        <Button flat
                className={cn('addButton', {
                  hidden: disabled,
                })}
                key="addBasisCompoundAtomButton"
                label="Add"
                onClick={e => onAddAtom(atoms.length)}
        >add</Button>
        {hasErrors && errors.modelErrors && (
          <ErrorMessages errors={errors.modelErrors} />
        )}
      </div>
    )
  }
}
BasisCompoundEditorFields.propTypes = {
  justificationBasisCompound: PropTypes.object,
  /** If present, this string will be prepended to this editor's controls' ids, with an intervening "." */
  id: PropTypes.string,
  /** If present, this string will be prepended to this editor's controls' names, with an intervening "." */
  name: PropTypes.string,
  /** If present, called when the user presses enter in a text field */
  onSubmit: PropTypes.func,
  onPropertyChange: PropTypes.func.isRequired,
  onAddAtom: PropTypes.func.isRequired,
  onRemoveAtom: PropTypes.func.isRequired,
  errors: PropTypes.object,
  /** Whether to disable the inputs */
  disabled: PropTypes.bool,
}
BasisCompoundEditorFields.defaultProps = {
  disabled: false,
}
