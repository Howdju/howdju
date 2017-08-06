import React, {Component} from 'react'
import PropTypes from 'prop-types'
import TextField from 'react-md/lib/TextFields/TextField'
import FontIcon from 'react-md/lib/FontIcons'
import Button from 'react-md/lib/Buttons/Button'
import cn from 'classnames'
import map from 'lodash/map'
import get from 'lodash/get'
import has from 'lodash/has'

import {RETURN_KEY_CODE} from "./keyCodes";
import CitationTextAutocomplete from "./CitationTextAutocomplete";
import {toErrorText} from "./modelErrorMessages";

import './CitationReferenceEditorFields.scss'
import StatementTextAutocomplete from "./StatementTextAutocomplete";

const atomsName = 'atoms'

class StatementCompoundEditorFields extends Component {
  constructor() {
    super()

    this.onChange = this.onChange.bind(this)
    this.onPropertyChange = this.onPropertyChange.bind(this)
    this.onTextInputKeyDown = this.onTextInputKeyDown.bind(this)
  }

  onChange(value, event) {
    const target = event.target;
    const name = target.name
    this.props.onPropertyChange({[name]: value})
  }

  onPropertyChange(properties) {
    this.props.onPropertyChange(properties)
  }

  onTextInputKeyDown(event) {
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
    } = this.props

    const namePrefix = name ? name + '.' : ''
    const idPrefix = id ? id + '.' : ''
    const suggestionsKeyPrefix = suggestionsKey ? suggestionsKey + '.' : ''

    const atoms = get(statementCompound, atomsName, '')

    const atomInputProps = (errors && errors.hasErrors) ?
        map(errors.fieldErrors.atoms.itemErrors, atomError => atomError.fieldErrors.statement.fieldErrors.text.length > 0 ?
            {error: true, errorText: toErrorText(atomError.fieldErrors.statement.fieldErrors.text)} :
            {}
        ) :
        map(atoms, () => null)

    return (
        <div>
          {map(atoms, (atom, index) => {
            const name = `atoms[${index}].statement.text`
            const value = get(statementCompound, name, '')
            const leftIcon = <FontIcon>short_text</FontIcon>
            const rightIcon = disabled ?
                <div/> :
                <div>
                  <Button icon onClick={e => this.props.onAddStatementAtom(index)}>add</Button>
                  <Button icon onClick={e => this.props.onRemoveStatementAtom(atom, index)}>delete</Button>
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
                  key="addStatementAtomButton"
                  label="Add Statement"
                  onClick={e => this.props.onAddStatementAtom(atoms.length)}
          >add</Button>
        </div>
    )
  }
}
StatementCompoundEditorFields.propTypes = {
  citationReference: PropTypes.object,
  /** If present, this string will be prepended to this editor's controls' ids, with an intervening "." */
  id: PropTypes.string,
  /** If present, this string will be prepended to this editor's controls' names, with an intervening "." */
  name: PropTypes.string,
  /** If present, called when the user presses enter in a text field */
  onSubmit: PropTypes.func,
  onPropertyChange: PropTypes.func.isRequired,
  onAddStatementAtom: PropTypes.func.isRequired,
  onRemoveStatementAtom: PropTypes.func.isRequired,
  errors: PropTypes.object,
  /** Whether to disable the inputs */
  disabled: PropTypes.bool,
}
StatementCompoundEditorFields.defaultProps = {
  disabled: false,
}

export default StatementCompoundEditorFields