import React, {Component} from 'react'
import PropTypes from 'prop-types'
import TextField from 'react-md/lib/TextFields/TextField'
import FontIcon from 'react-md/lib/FontIcons'
import Button from 'react-md/lib/Buttons/Button'
import cn from 'classnames'
import map from 'lodash/map'
import get from 'lodash/get'

import {RETURN_KEY_CODE} from "./keyCodes"
import {toErrorText} from "./modelErrorMessages"
import ErrorMessages from './ErrorMessages'

import './WritQuoteEditorFields.scss'
import StatementTextAutocomplete from "./StatementTextAutocomplete"

const atomsName = 'atoms'

class StatementCompoundEditorFields extends Component {

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
      statementCompound,
      name,
      id,
      suggestionsKey,
      disabled,
      errors,
      onAddStatementCompoundAtom,
      onRemoveStatementCompoundAtom,
    } = this.props

    const namePrefix = name ? name + '.' : ''
    const idPrefix = id ? id + '.' : ''
    const suggestionsKeyPrefix = suggestionsKey ? suggestionsKey + '.' : ''

    const atoms = get(statementCompound, atomsName, '')

    const hasErrors = errors && errors.hasErrors
    const atomInputProps = hasErrors ?
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

          return suggestionsKey && !disabled ?
            <StatementTextAutocomplete {...atomInputProps[index]}
                                       id={idPrefix + name}
                                       key={name}
                                       name={namePrefix + name}
                                       type="text"
                                       label="Text"
                                       value={value}
                                       suggestionsKey={suggestionsKeyPrefix + name}
                                       onPropertyChange={this.onPropertyChange}
                                       leftIcon={leftIcon}
                                       rightIcon={rightIcon}
                                       onKeyDown={this.onTextInputKeyDown}
            /> :
            <TextField {...atomInputProps[index]}
                       id={idPrefix + name}
                       key={name}
                       name={namePrefix + name}
                       label="Text"
                       type="text"
                       value={value}
                       onChange={this.onChange}
                       leftIcon={leftIcon}
                       rightIcon={rightIcon}
                       disabled={disabled}
                       onKeyDown={this.onTextInputKeyDown}
            />
        })}
        <Button flat
                className={cn('addButton', {
                  hidden: disabled,
                })}
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
  onSubmit: PropTypes.func,
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