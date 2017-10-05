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
      onAddWritQuoteUrl,
      onRemoveWritQuoteUrl,
      onPropertyChange,
      ...rest,
    } = this.props

    return (
      <div className="source-excerpt-paraphrase-editor-fields">

        <div className="source-excerpt-paraphrase-editor-fields--paraphrasing-statement-editor-fields">
          <StatementEditorFields
            {...rest}
            id={id + '--paraphrasing-statement'}
            name={name + '.paraphrasingStatement'}
            textLabel="Paraphrase"
            statement={sourceExcerptParaphrase.paraphrasingStatement}
            errors={get(errors, 'fieldErrors.paraphrasingStatement')}
            onPropertyChange={onPropertyChange}
          />
        </div>

        <h4>
          Source excerpt
        </h4>

        <SourceExcerptEditorFields
          {...rest}
          sourceExcerpt={sourceExcerptParaphrase.sourceExcerpt}
          id={id + '--source-excerpt'}
          name={name + '.sourceExcerpt'}
          errors={get(errors, 'fieldErrors.sourceExcerpt')}
          onPropertyChange={onPropertyChange}
          onAddWritQuoteUrl={onAddWritQuoteUrl}
          onRemoveWritQuoteUrl={onRemoveWritQuoteUrl}
        />

      </div>
    )
  }
}
