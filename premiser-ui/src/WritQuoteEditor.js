import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {connect} from "react-redux"
import Button from 'react-md/lib/Buttons/Button'
import CardActions from 'react-md/lib/Cards/CardActions'
import CardText from 'react-md/lib/Cards/CardText'
import CircularProgress from 'react-md/lib/Progress/CircularProgress'
import get from 'lodash/get'

import {
  editors,
  mapActionCreatorGroupToDispatchToProps,
} from './actions'
import {EditorTypes} from "./reducers/editors"
import {
  CANCEL_BUTTON_LABEL, EDIT_STATEMENT_SUBMIT_BUTTON_LABEL
} from "./texts"
import t from './texts'
import WritQuoteEditorFields from "./WritQuoteEditorFields"

class WritQuoteEditor extends Component {

  onPropertyChange = (properties) => {
    this.props.editors.propertyChange(WritQuoteEditor.editorType, this.props.editorId, properties)
  }

  onSubmit = (event) => {
    event.preventDefault()
    this.props.editors.commitEdit(WritQuoteEditor.editorType, this.props.editorId)
  }

  onCancelEdit = () => {
    this.props.editors.cancelEdit(WritQuoteEditor.editorType, this.props.editorId)
  }

  onAddUrl = () => {
    this.props.editors.addUrl(WritQuoteEditor.editorType, this.props.editorId)
  }

  onRemoveUrl = (url, index) => {
    this.props.editors.removeUrl(WritQuoteEditor.editorType, this.props.editorId, url, index)
  }

  render() {
    const {
      id,
      suggestionsKey,
      editorState: {
        errors,
        editEntity,
        isFetching,
        isSaving,
      },
      ...rest
    } = this.props

    const inProgress = isFetching || isSaving

    return (
      <form onSubmit={this.onSubmit}>
        <CardText>
          <WritQuoteEditorFields {...rest}
                                         id={id}
                                         writQuote={editEntity}
                                         disabled={isSaving}
                                         suggestionsKey={suggestionsKey}
                                         onPropertyChange={this.onPropertyChange}
                                         onAddUrl={this.onAddUrl}
                                         onRemoveUrl={this.onRemoveUrl}
                                         errors={errors}
                                         onSubmit={this.onSubmit}
          />
        </CardText>
        <CardActions>
          {inProgress && <CircularProgress key="progress" id="progress" />}
          <Button flat
                  key="cancelButton"
                  label={t(CANCEL_BUTTON_LABEL)}
                  onClick={this.onCancelEdit}
                  disabled={inProgress}
          />
          <Button raised
                  primary
                  key="submitButton"
                  type="submit"
                  label={t(EDIT_STATEMENT_SUBMIT_BUTTON_LABEL)}
                  disabled={inProgress}
          />
        </CardActions>
      </form>
    )

  }
}
WritQuoteEditor.propTypes = {
  /** Required for the CircularProgress */
  id: PropTypes.string.isRequired,
  /** Identifies the editor's state */
  editorId: PropTypes.string.isRequired,
  /** If omitted, no autocomplete */
  suggestionsKey: PropTypes.string,
}
WritQuoteEditor.editorType = EditorTypes.WRIT_QUOTE

const mapStateToProps = (state, ownProps) => {
  const editorState = get(state.editors, [WritQuoteEditor.editorType, ownProps.editorId], {})
  return {
    editorState,
  }
}

export default connect(mapStateToProps, mapActionCreatorGroupToDispatchToProps({
  editors,
}))(WritQuoteEditor)