import React, {Component} from 'react'
import get from 'lodash/get'

import StatementEditorFields from './StatementEditorFields'
import SourceExcerptEditorFields from './SourceExcerptEditorFields'

import './SourceExcerptParaphraseEditorFields.scss'

export default class SourceExcerptParaphraseEditorFields extends Component {
  render() {
    const {
      sourceExcerptParaphrase,
      id,
      name,
      errors,
      readOnlyBasis,
      disabled,
      onPropertyChange,
      onAddWritQuoteUrl,
      onRemoveWritQuoteUrl,
      onSubmit,
      suggestionsKey,
      onKeyDown,
    } = this.props

    return (
      <div className="source-excerpt-paraphrase-editor-fields">

        <div className="source-excerpt-paraphrase-editor-fields--paraphrasing-statement-editor-fields">
          <StatementEditorFields
            id={id + '--paraphrasing-statement'}
            name={name + '.paraphrasingStatement'}
            textLabel="Paraphrase"
            statement={sourceExcerptParaphrase.paraphrasingStatement}
            disabled={disabled}
            suggestionsKey={suggestionsKey}
            onPropertyChange={onPropertyChange}
            onKeyDown={onKeyDown}
            errors={get(errors, 'fieldErrors.paraphrasingStatement')}
          />
        </div>

        <h4>
          Source excerpt
        </h4>

        <SourceExcerptEditorFields
          sourceExcerpt={sourceExcerptParaphrase.sourceExcerpt}
          id={id + '--source-excerpt'}
          name={name + '.sourceExcerpt'}
          errors={get(errors, 'fieldErrors.sourceExcerpt')}
          readOnlyBasis={readOnlyBasis}
          disabled={disabled}
          onPropertyChange={onPropertyChange}
          onAddWritQuoteUrl={onAddWritQuoteUrl}
          onRemoveWritQuoteUrl={onRemoveWritQuoteUrl}
          onSubmit={onSubmit}
        />

      </div>
    )
  }
}
