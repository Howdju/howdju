import React, {Component} from 'react'
import PropTypes from 'prop-types'
import EditableWritQuote from './EditableWritQuote'

import {
  SourceExcerptType,
  newExhaustedEnumError,
} from 'howdju-common'

export default class SourceExcerptViewer extends Component {
  render() {
    const {
      id,
      sourceExcerpt,
      editorId,
      suggestionsKey,
      doShowControls,
      showStatusText,
      ...rest
    } = this.props

    switch (sourceExcerpt.type) {
      case SourceExcerptType.WRIT_QUOTE:
        return (
          <EditableWritQuote
            {...rest}
            id={id}
            writQuote={sourceExcerpt.entity}
            editorId={editorId}
            suggestionsKey={suggestionsKey}
            doShowControls={doShowControls}
            showStatusText={showStatusText}
          />
        )
      default:
        throw newExhaustedEnumError('SourceExcerptType', sourceExcerpt.type)
    }
  }
}
SourceExcerptViewer.propTypes = {
  id: PropTypes.string.isRequired,
  sourceExcerpt: PropTypes.object.isRequired,
  editorId: PropTypes.string,
  suggestionsKey: PropTypes.string,
  doShowControls: PropTypes.bool,
}
SourceExcerptViewer.defaultProps = {
  doShowControls: true,
}