import React, {Component} from 'react'
import get from 'lodash/get'

import PropositionEditorFields from './PropositionEditorFields'
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
      ...rest
    } = this.props

    return (
      <div className="source-excerpt-paraphrase-editor-fields">

        <div className="source-excerpt-paraphrase-editor-fields--paraphrasing-proposition-editor-fields">
          <PropositionEditorFields
            {...rest}
            id={id + '--paraphrasing-proposition'}
            name={name + '.paraphrasingProposition'}
            textLabel="Paraphrase"
            proposition={sourceExcerptParaphrase.paraphrasingProposition}
            errors={get(errors, 'fieldErrors.paraphrasingProposition')}
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
