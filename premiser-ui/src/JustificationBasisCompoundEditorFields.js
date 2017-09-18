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

export default class JustificationBasisCompoundEditorFields extends Component {

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
      onAddJustificationBasisCompoundAtom,
      onRemoveJustificationBasisCompoundAtom,
      disabled,
      errors,
    } = this.props

    const atoms = get(justificationBasisCompound, atomsName, [])

    const hasErrors = errors && errors.hasErrors
    const atomItemsErrors = get(errors, 'fieldErrors.atoms.itemErrors')
    const atomComponents = map(atoms, (atom, index) => {
      const atomItemErrors = get(atomItemsErrors, index)
      return makeAtomFields(atom, index, name, id, suggestionsKey, atomItemErrors,
        onAddJustificationBasisCompoundAtom, onRemoveJustificationBasisCompoundAtom, disabled, this.onChange, this.onPropertyChange,
        this.onTextInputKeyDown)
    })

    return (
      <div>
        {atomComponents}
        <Button flat
                className={cn('addButton', {
                  hidden: disabled,
                })}
                key="addBasisCompoundAtomButton"
                label="Add"
                onClick={e => onAddJustificationBasisCompoundAtom(atoms.length)}
        >add</Button>
        {hasErrors && errors.modelErrors && (
          <ErrorMessages errors={errors.modelErrors} />
        )}
      </div>
    )
  }
}
JustificationBasisCompoundEditorFields.propTypes = {
  justificationBasisCompound: PropTypes.object,
  /** If present, this string will be prepended to this editor's controls' ids, with an intervening "." */
  id: PropTypes.string,
  /** If present, this string will be prepended to this editor's controls' names, with an intervening "." */
  name: PropTypes.string,
  /** If present, called when the user presses enter in a text field */
  onSubmit: PropTypes.func,
  onPropertyChange: PropTypes.func.isRequired,
  onAddJustificationBasisCompoundAtom: PropTypes.func.isRequired,
  onRemoveJustificationBasisCompoundAtom: PropTypes.func.isRequired,
  errors: PropTypes.object,
  /** Whether to disable the inputs */
  disabled: PropTypes.bool,
}
JustificationBasisCompoundEditorFields.defaultProps = {
  disabled: false,
}

function makeAtomFields(atom, index, name, id, suggestionsKey, atomItemErrors,
                         onAddJustificationBasisCompoundAtom, onRemoveJustificationBasisCompoundAtom, disabled,
                         onChange, onPropertyChange, onTextInputKeyDown) {

  const atomEntityId = id + `.atoms[${index}].entity`
  const atomEntityName = name + `.atoms[${index}].entity`
  const atomEntitySuggestionsKey = suggestionsKey + `.atoms[${index}].entity`

  const rightIcon = disabled ?
    <div/> :
    <div>
      <Button icon onClick={e => onAddJustificationBasisCompoundAtom(index)}>add</Button>
      <Button icon onClick={e => onRemoveJustificationBasisCompoundAtom(atom, index)}>delete</Button>
    </div>

  switch (atom.type) {
    case JustificationBasisCompoundAtomType.STATEMENT: {
      return makeStatementAtomFields(atom, atomEntityName, atomEntityId, atomEntitySuggestionsKey, atomItemErrors, rightIcon,
        disabled, onChange, onPropertyChange, onTextInputKeyDown)
    }
    case JustificationBasisCompoundAtomType.SOURCE_EXCERPT_PARAPHRASE: {
      return makeParaphraseAtomFields(atom, atomEntityName, atomEntityId, atomEntitySuggestionsKey, atomItemErrors, rightIcon,
        disabled, onChange, onPropertyChange, onTextInputKeyDown)
    }
    default:
      logger.error(`Unsupported JustificationBasisCompoundAtomType: ${atom.type}`)
      return
  }
}

function makeStatementAtomFields(atom, name, id, suggestionsKey, atomItemErrors, rightIcon, disabled,
                                 onChange, onPropertyChange, onTextInputKeyDown) {
  const value = get(atom, ['entity', statementTextName], '')
  const leftIcon = <FontIcon>short_text</FontIcon>
  const idPrefix = id + '.'
  const namePrefix = name + '.'
  const suggestionsKeyPrefix = suggestionsKey + '.'

  const statementTextErrors = get(atomItemErrors, 'fieldErrors.entity.fieldErrors.text', [])
  const atomErrorProps = statementTextErrors.length > 0 ?
    {error: true, errorText: toErrorText(statementTextErrors)} :
    {}
  return suggestionsKey && !disabled ?
    <StatementTextAutocomplete {...atomErrorProps}
                               id={idPrefix + statementTextName}
                               key={idPrefix + statementTextName}
                               name={namePrefix + statementTextName}
                               type="text"
                               label="Text"
                               value={value}
                               suggestionsKey={suggestionsKeyPrefix + name}
                               onPropertyChange={onPropertyChange}
                               leftIcon={leftIcon}
                               rightIcon={rightIcon}
                               onKeyDown={onTextInputKeyDown}
    /> :
    <TextField {...atomErrorProps}
               id={idPrefix + statementTextName}
               key={idPrefix + statementTextName}
               name={namePrefix + statementTextName}
               type="text"
               label="Text"
               value={value}
               onChange={onChange}
               leftIcon={leftIcon}
               rightIcon={rightIcon}
               disabled={disabled}
               onKeyDown={onTextInputKeyDown}
    />
}

function makeParaphraseAtomFields () {}