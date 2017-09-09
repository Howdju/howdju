import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {connect} from "react-redux"
import CircularProgress from "react-md/lib/Progress/CircularProgress"
import get from 'lodash/get'

import {EditorTypes} from "./reducers/editors"
import WritingQuoteViewer from "./WritingQuoteViewer"
import WritingQuoteEditor from "./WritingQuoteEditor"
import {denormalize} from "normalizr"
import {writingQuoteSchema} from "./schemas"
import ExpandableChildContainer from './ExpandableChildContainer'

class EditableWritingQuote extends Component {

  render() {
    const {
      id,
      editorId,
      writingQuote,
      suggestionsKey,
      isFetching,
      isEditing,
      ...rest
    } = this.props

    const editor =
      <WritingQuoteEditor {...rest}
                               id={id}
                               editorId={editorId}
                               suggestionsKey={suggestionsKey}
      />
    const viewer = (
      <ExpandableChildContainer {...rest}
                                ExpandableChildComponent={WritingQuoteViewer}
                                widgetId={id}
                                key={id}
                                writingQuote={writingQuote}
      />
    )
    const progress =
      <CircularProgress id={`${id}-Progress`} />

    return isEditing ?
      editor :
      isFetching ? progress : viewer
  }
}
EditableWritingQuote.propTypes = {
  /** Required for the CircularProgress */
  id: PropTypes.string.isRequired,
  /** Let's the component fetch its statement from the API and retrieve it from the state */
  entityId: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]).isRequired,
  /** Identifies the editor's state */
  editorId: PropTypes.string.isRequired,
  /** If omitted, no autocomplete */
  suggestionsKey: PropTypes.string,
}

const mapStateToProps = (state, ownProps) => {
  const writingQuote = denormalize(state.entities.writingQuotes[ownProps.entityId], writingQuoteSchema, state.entities)
  const editEntity = get(state.editors, [EditorTypes.WRITING_QUOTE, ownProps.editorId, 'editEntity'])
  const isEditing = !!editEntity
  return {
    writingQuote,
    isEditing,
  }
}

export default connect(mapStateToProps)(EditableWritingQuote)