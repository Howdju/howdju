import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {
  Button,
  FontIcon,
  SelectionControlGroup,
} from 'react-md'
import get from 'lodash/get'

import {
  JustificationBasisCompoundAtomTypes,
  newExhaustedEnumError,
} from 'howdju-common'

import SourceExcerptParaphraseEditorFields from './SourceExcerptParaphraseEditorFields'
import PropositionEditorFields from "./PropositionEditorFields"
import {
  combineSuggestionsKeys,
  combineNames,
  combineIds,
} from './viewModels'
import windowAware from './windowAware'

import './JustificationBasisCompoundAtomEditorFields.scss'


class JustificationBasisCompoundAtomEditorFields extends Component {

  onChange = (value, event) => {
    const name = event.target.name
    this.props.onPropertyChange({[name]: value})
  }

  render() {
    const {
      atom,
      name,
      id,
      suggestionsKey,
      errors,
      onAddJustificationBasisCompoundAtom,
      onRemoveJustificationBasisCompoundAtom,
      disabled,
      onPropertyChange,
      onAddWritQuoteUrl,
      onRemoveWritQuoteUrl,
      onKeyDown,
      onSubmit,
      isWindowNarrow,
      header,
    } = this.props

    const atomTypeControls = (
      <SelectionControlGroup
        id={combineIds(id, "type")}
        name={combineNames(name, "type")}
        type="radio"
        value={atom.type}
        onChange={this.onChange}
        inline={isWindowNarrow}
        className="atom-type-controls"
        controls={[
          {
            value: JustificationBasisCompoundAtomTypes.PROPOSITION,
            label: (
              <div className="selection-label">
                <FontIcon>short_text</FontIcon>
                {isWindowNarrow && <span className="selection-label--text">Proposition</span>}
              </div>
            ),
            title: 'Proposition-based clause',
          },
          {
            value: JustificationBasisCompoundAtomTypes.SOURCE_EXCERPT_PARAPHRASE,
            label: (
              <div className="selection-label">
                <FontIcon>textsms</FontIcon>
                {isWindowNarrow && <span className="selection-label--text">Source excerpt paraphrase</span>}
              </div>
            ),
            title: 'Source-excerpt-paraphrase-based clause',
          }
        ]}
        disabled={disabled}
      />
    )

    let entityControls
    switch (atom.type) {
      case JustificationBasisCompoundAtomTypes.PROPOSITION: {
        const entityName = 'proposition'
        const entityEditorFieldsId = combineIds(id, entityName)
        const entityEditorFieldsName = combineNames(name, entityName)
        const entitySuggestionsKey = combineSuggestionsKeys(suggestionsKey, entityName)
        const entity = atom.proposition
        const entityEditorFieldsErrors = get(errors, 'fieldErrors.proposition')
        entityControls = (
          <PropositionEditorFields
            id={entityEditorFieldsId}
            name={entityEditorFieldsName}
            proposition={entity}
            disabled={disabled}
            suggestionsKey={entitySuggestionsKey}
            onPropertyChange={onPropertyChange}
            onKeyDown={onKeyDown}
            onSubmit={onSubmit}
            errors={entityEditorFieldsErrors}
          />
        )
        break
      }
      case JustificationBasisCompoundAtomTypes.SOURCE_EXCERPT_PARAPHRASE: {
        const entityName = 'sourceExcerptParaphrase'
        const entityEditorFieldsId = combineIds(id, entityName)
        const entityEditorFieldsName = combineNames(name, entityName)
        const entitySuggestionsKey = combineSuggestionsKeys(suggestionsKey, entityName)
        const entity = atom.sourceExcerptParaphrase
        const entityEditorFieldsErrors = get(errors, 'fieldErrors.sourceExcerptParaphrase')
        entityControls = (
          <SourceExcerptParaphraseEditorFields
            id={entityEditorFieldsId}
            name={entityEditorFieldsName}
            sourceExcerptParaphrase={entity}
            disabled={disabled}
            suggestionsKey={entitySuggestionsKey}
            onPropertyChange={onPropertyChange}
            onKeyDown={onKeyDown}
            onSubmit={onSubmit}
            errors={entityEditorFieldsErrors}
            onAddWritQuoteUrl={onAddWritQuoteUrl}
            onRemoveWritQuoteUrl={onRemoveWritQuoteUrl}
          />
        )
        break
      }
      default:
        throw newExhaustedEnumError('JustificationBasisCompoundAtomTypes', atom.type)
    }

    const addRemoveAtomControlProps = {
      icon: !isWindowNarrow,
      flat: isWindowNarrow,
      disabled: disabled
    }
    const addRemoveAtomControls = (
      <div>
        <Button
          {...addRemoveAtomControlProps}
          onClick={onAddJustificationBasisCompoundAtom}
          title="Add clause"
          iconEl={<FontIcon>add</FontIcon>}
          children={isWindowNarrow && "Add clause"}
        />
        <Button
          {...addRemoveAtomControlProps}
          onClick={onRemoveJustificationBasisCompoundAtom}
          title="Remove clause"
          iconEl={<FontIcon>delete</FontIcon>}
          children={isWindowNarrow && "Remove clause"}
        />
      </div>
    )

    return (
      <div className="justification-basis-compound-atom-editor-fields">
        <div className="justification-basis-compound-atom-editor-fields--atom-type-controls">
          {header}
          {atomTypeControls}
        </div>
        <div className="justification-basis-compound-atom-editor-fields--entity-controls">
          {entityControls}
        </div>
        <div className="justification-basis-compound-atom-editor-fields--add-remove-atom-controls">
          {addRemoveAtomControls}
        </div>
      </div>
    )
  }
}
JustificationBasisCompoundAtomEditorFields.propTypes = {
  atom: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  suggestionsKey: PropTypes.string,
  errors: PropTypes.object,
  onAddJustificationBasisCompoundAtom: PropTypes.func,
  onRemoveJustificationBasisCompoundAtom: PropTypes.func,
  disabled: PropTypes.bool,
  onPropertyChange: PropTypes.func.isRequired,
  onTextInputKeyDown: PropTypes.func,
}

export default windowAware(JustificationBasisCompoundAtomEditorFields)
