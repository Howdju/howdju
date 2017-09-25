import React, {Component} from 'react'
import PropTypes from 'prop-types'
import EditableWritQuote from './EditableWritQuote'

import {
  SourceExcerptType,
  newExhaustedEnumError,
} from 'howdju-common'

export default class EditableSourceExcerpt extends Component {
  render() {
    const {
      id,
      sourceExcerpt,
      editorId,
      suggestionsKey,
      doShowControls,
      ...rest
    } = this.props

    switch (sourceExcerpt.type) {
      case SourceExcerptType.WRIT_QUOTE:
        return (
          <EditableWritQuote
            {...rest}
            id={id}
            entityId={sourceExcerpt.entity.id}
            editorId={editorId}
            suggestionsKey={suggestionsKey}
            doShowControls={doShowControls}
          />
        )
      default:
        throw newExhaustedEnumError('SourceExcerptType', sourceExcerpt.type)
    }
  }
}
EditableSourceExcerpt.propTypes = {
  id: PropTypes.string.isRequired,
  sourceExcerpt: PropTypes.object.isRequired,
  editorId: PropTypes.string.isRequired,
  suggestionsKey: PropTypes.string,
  doShowControls: PropTypes.bool,
}
EditableSourceExcerpt.defaultProps = {
  doShowControls: true,
}