import React, {Component} from 'react'
import PropTypes from 'prop-types'
import FontIcon from 'react-md/lib/FontIcons'
import Button from 'react-md/lib/Buttons/Button'
import SelectionControlGroup from 'react-md/lib/SelectionControls/SelectionControlGroup'
import get from 'lodash/get'

import {
  JustificationBasisCompoundAtomType,
  newExhaustedEnumError,
} from 'howdju-common'

import SourceExcerptParaphraseEditorFields from './SourceExcerptParaphraseEditorFields'
import StatementEditorFields from "./StatementEditorFields"
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
            value: JustificationBasisCompoundAtomType.STATEMENT,
            label: (
              <div className="selection-label">
                <FontIcon>short_text</FontIcon>
                {isWindowNarrow && <span className="selection-label--text">Statement</span>}
              </div>
            ),
            title: 'Statement-based clause',
          },
          {
            value: JustificationBasisCompoundAtomType.SOURCE_EXCERPT_PARAPHRASE,
            label: (
              <div className="selection-label">
                <FontIcon>book</FontIcon>
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
      case JustificationBasisCompoundAtomType.STATEMENT: {
        const entityName = 'statement'
        const entityEditorFieldsId = combineIds(id, entityName)
        const entityEditorFieldsName = combineNames(name, entityName)
        const entitySuggestionsKey = combineSuggestionsKeys(suggestionsKey, entityName)
        const entity = atom.statement
        const entityEditorFieldsErrors = get(errors, 'fieldErrors.statement')
        entityControls = (
          <StatementEditorFields
            id={entityEditorFieldsId}
            name={entityEditorFieldsName}
            statement={entity}
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
      case JustificationBasisCompoundAtomType.SOURCE_EXCERPT_PARAPHRASE: {
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
        throw newExhaustedEnumError('JustificationBasisCompoundAtomType', atom.type)
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
          children="add"
          label={isWindowNarrow && "Add clause"}
        />
        <Button
          {...addRemoveAtomControlProps}
          onClick={onRemoveJustificationBasisCompoundAtom}
          title="Remove clause"
          children="delete"
          label={isWindowNarrow && "Remove clause"}
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