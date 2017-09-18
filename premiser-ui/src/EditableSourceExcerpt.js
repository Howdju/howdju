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
      type,
      sourceExcerpt,
      editorId,
      suggestionsKey,
      doShowControls,
      ...rest
    } = this.props

    switch (type) {
      case SourceExcerptType.WRIT_QUOTE:
        return (
          <EditableWritQuote {...rest}
                             id={id}
                             entityId={sourceExcerpt.id}
                             editorId={editorId}
                             suggestionsKey={suggestionsKey}
                             doShowControls={doShowControls}
          />
        )
      default:
        throw newExhaustedEnumError('SourceExcerptType', type)
    }
  }
}
EditableSourceExcerpt.propTypes = {
  id: PropTypes.string.isRequired,
  /** A SourceExcerptType */
  type: PropTypes.string.isRequired,
  sourceExcerpt: PropTypes.object.isRequired,
  editorId: PropTypes.string.isRequired,
  suggestionsKey: PropTypes.string,
  doShowControls: PropTypes.bool,
}
EditableSourceExcerpt.defaultProps = {
  doShowControls: true,
}