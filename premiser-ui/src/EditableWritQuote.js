import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {connect} from "react-redux"
import CircularProgress from "react-md/lib/Progress/CircularProgress"
import get from 'lodash/get'

import {EditorTypes} from "./reducers/editors"
import WritQuoteViewer from "./WritQuoteViewer"
import WritQuoteEditor from "./WritQuoteEditor"
import {denormalize} from "normalizr"
import {writQuoteSchema} from "./schemas"
import ExpandableChildContainer from './ExpandableChildContainer'

class EditableWritQuote extends Component {

  render() {
    const {
      id,
      editorId,
      writQuote,
      suggestionsKey,
      isFetching,
      isEditing,
      ...rest
    } = this.props

    const editor =
      <WritQuoteEditor
        {...rest}
        id={id}
        editorId={editorId}
        suggestionsKey={suggestionsKey}
      />
    const viewer = (
      <ExpandableChildContainer
        {...rest}
        ExpandableChildComponent={WritQuoteViewer}
        widgetId={id}
        key={id}
        writQuote={writQuote}
      />
    )
    const progress =
      <CircularProgress id={`${id}-Progress`} />

    return isEditing ?
      editor :
      isFetching ? progress : viewer
  }
}
EditableWritQuote.propTypes = {
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
  const writQuote = denormalize(state.entities.writQuotes[ownProps.entityId], writQuoteSchema, state.entities)
  const editEntity = get(state.editors, [EditorTypes.WRIT_QUOTE, ownProps.editorId, 'editEntity'])
  const isEditing = !!editEntity
  return {
    writQuote,
    isEditing,
  }
}

export default connect(mapStateToProps)(EditableWritQuote)