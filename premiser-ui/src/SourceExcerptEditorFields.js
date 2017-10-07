import React, {Component} from 'react'
import FontIcon from 'react-md/lib/FontIcons/FontIcon'
import SelectionControlGroup from 'react-md/lib/SelectionControls/SelectionControlGroup'

import get from 'lodash/get'

import {
  SourceExcerptType,
  newExhaustedEnumError,
} from 'howdju-common'

import WritQuoteEditorFields from './WritQuoteEditorFields'
import windowAware from './windowAware'

import './SourceExcerptEditorFields.scss'


class SourceExcerptEditorFields extends Component {

  onChange = (value, event) => {
    const name = event.target.name
    this.props.onPropertyChange({[name]: value})
  }

  render() {
    const {
      sourceExcerpt,
      id,
      name,
      errors,
      disabled,
      onPropertyChange,
      onAddWritQuoteUrl,
      onRemoveWritQuoteUrl,
      onKeyDown,
      onSubmit,
      suggestionsKey,
      isWindowNarrow,
    } = this.props

    const sourceExcerptTypeControls = (
      <SelectionControlGroup
        id={id + "-type"}
        name={name + ".type"}
        type="radio"
        value={sourceExcerpt.type}
        onChange={this.onChange}
        inline={isWindowNarrow}
        controls={[
          {
            value: SourceExcerptType.WRIT_QUOTE,
            label: (
              <div className="selection-label">
                <FontIcon>book</FontIcon>
                {isWindowNarrow && <span className="selection-label--text">Writ quote</span>}
              </div>
            ),
            title: 'Writ quote',
          },
          {
            value: SourceExcerptType.PIC_REGION,
            label: (
              <div className="selection-label">
                <FontIcon>photo</FontIcon>
                {isWindowNarrow && <span className="selection-label--text">Pic</span>}
              </div>
            ),
            title: 'Pic',
          },
          {
            value: SourceExcerptType.VID_SEGMENT,
            label: (
              <div className="selection-label">
                <FontIcon>videocam</FontIcon>
                {isWindowNarrow && <span className="selection-label--text">Vid</span>}
              </div>
            ),
            title: 'Vid',
          },
        ]}
        disabled={disabled}
      />
    )

    let sourceExcerptEntityEditorFields
    switch (sourceExcerpt.type) {
      case SourceExcerptType.WRIT_QUOTE: {
        const entity = sourceExcerpt.writQuote
        const entityId = id + '--writ-quote'
        const entityName = name + '.writQuote'
        const entitySuggestionsKey = suggestionsKey + '--writ-quote'
        const entityErrors = get(errors, 'fieldErrors.writQuote')
        sourceExcerptEntityEditorFields = (
          <WritQuoteEditorFields
            writQuote={entity}
            id={entityId}
            name={entityName}
            suggestionsKey={entitySuggestionsKey}
            onPropertyChange={onPropertyChange}
            onAddUrl={onAddWritQuoteUrl}
            onRemoveUrl={onRemoveWritQuoteUrl}
            disabled={disabled}
            errors={entityErrors}
            onKeyDown={onKeyDown}
            onSubmit={onSubmit}
          />
        )
        break
      }
      case SourceExcerptType.PIC_REGION: {
        sourceExcerptEntityEditorFields = (
          <span>Coming soon</span>
        )
        break
      }
      case SourceExcerptType.VID_SEGMENT: {
        sourceExcerptEntityEditorFields = (
          <span>Coming soon</span>
        )
        break
      }
      default:
        throw newExhaustedEnumError('SourceExcerptType', sourceExcerpt.type)
    }
    return (

      <div className="source-excerpt-editor-fields">
        <div className="source-excerpt-editor-fields--type-controls">
          {sourceExcerptTypeControls}
        </div>
        <div className="source-excerpt-editor-fields--entity-controls">
          {sourceExcerptEntityEditorFields}
        </div>
      </div>
    )
  }
}

export default windowAware(SourceExcerptEditorFields)