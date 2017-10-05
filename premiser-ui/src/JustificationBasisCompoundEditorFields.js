import React, {Component} from 'react'
import PropTypes from 'prop-types'
import Button from 'react-md/lib/Buttons/Button'
import Divider from 'react-md/lib/Dividers/Divider'
import flatMap from 'lodash/flatMap'
import get from 'lodash/get'
import map from 'lodash/map'

import ErrorMessages from './ErrorMessages'
import JustificationBasisCompoundAtomEditorFields from "./JustificationBasisCompoundAtomEditorFields"
import {
  combineSuggestionsKeys,
  combineNames,
  combineIds,
} from './viewModels'

import './WritQuoteEditorFields.scss'


const atomsName = 'atoms'

export default class JustificationBasisCompoundEditorFields extends Component {

  render() {
    const {
      justificationBasisCompound,
      name,
      id,
      suggestionsKey,
      onAddJustificationBasisCompoundAtom,
      onRemoveJustificationBasisCompoundAtom,
      onAddJustificationBasisCompoundAtomSourceExcerptParaphraseWritQuoteUrl,
      onRemoveJustificationBasisCompoundAtomSourceExcerptParaphraseWritQuoteUrl,
      disabled,
      errors,
      onPropertyChange,
      onKeyDown,
      onSubmit,
    } = this.props

    const atoms = get(justificationBasisCompound, atomsName, [])

    const hasErrors = errors && errors.hasErrors
    const atomItemsErrors = get(errors, 'fieldErrors.atoms.itemErrors')
    const atomsEditorFields = map(atoms, (atom, index) => {
      const atomName = `atoms[${index}]`
      const atomFieldsId = combineIds(id, atomName)
      const atomFieldsName = combineNames(name, atomName)
      const atomFieldsSuggestionsKey = combineSuggestionsKeys(suggestionsKey, atomName)
      const atomItemErrors = get(atomItemsErrors, index)
      return (
        <JustificationBasisCompoundAtomEditorFields
          atom={atom}
          id={atomFieldsId}
          key={atomFieldsId}
          name={atomFieldsName}
          suggestionsKey={atomFieldsSuggestionsKey}
          errors={atomItemErrors}
          onAddJustificationBasisCompoundAtom={e => onAddJustificationBasisCompoundAtom(index)}
          onRemoveJustificationBasisCompoundAtom={e => onRemoveJustificationBasisCompoundAtom(atom, index)}
          onAddWritQuoteUrl={(urlIndex, e) => onAddJustificationBasisCompoundAtomSourceExcerptParaphraseWritQuoteUrl(index, urlIndex)}
          onRemoveWritQuoteUrl={(url, urlIndex, e) => onRemoveJustificationBasisCompoundAtomSourceExcerptParaphraseWritQuoteUrl(atom, index, url, urlIndex)}
          disabled={disabled}
          onPropertyChange={onPropertyChange}
          onKeyDown={onKeyDown}
          onSubmit={onSubmit}
        />
      )
    })
    const dividedAtomEditorFields = flatMap(atomsEditorFields, (atomEditorFields, index) => {
      return index === atomsEditorFields.length - 1 ?
        atomEditorFields :
        [atomEditorFields, <Divider key={`atom-editor-fields-divider-${index}`} inset />]
    })

    return (
      <div className="justification-basis-compound-editor-fields">
        {dividedAtomEditorFields}

        <Button
          flat
          className="add-button"
          key="addBasisCompoundAtomButton"
          label="Add clause"
          onClick={e => onAddJustificationBasisCompoundAtom(atoms.length)}
          disabled={disabled}
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