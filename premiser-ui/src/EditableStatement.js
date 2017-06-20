import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {connect} from "react-redux";
import CircularProgress from "react-md/lib/Progress/CircularProgress";
import get from 'lodash/get'

import {EditorTypes} from "./reducers/editors";
import StatementViewer from "./StatementViewer";
import StatementEditor from "./StatementEditor";
import {isTruthy} from './util'
import {editors, mapActionCreatorGroupToDispatchToProps} from './actions'

class EditableStatement extends Component {

  render() {
    const {
      id,
      editorId,
      statement,
      suggestionsKey,
      isFetching,
      isEditing,
      ...rest,
    } = this.props
    delete rest.entityId

    // statement is required, so make this lazy.  Is this a problem for react efficiency-wise?
    const editor =
        <StatementEditor {...rest}
                         editorId={editorId}
                         id={id}
                         suggestionsKey={suggestionsKey}
        />
    const viewer =
        <StatementViewer {...rest}
                         id={id}
                         statement={statement}
        />
    const progress =
        <CircularProgress id={`${id}-Progress`} />

    return isEditing ?
        editor :
        isFetching ? progress : viewer
  }
}
EditableStatement.propTypes = {
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
  const statement = state.entities.statements[ownProps.entityId]
  // IF it hasn't been edited, then there's no editor state...
  const {editEntity, isFetching} = get(state.editors, [EditorTypes.STATEMENT, ownProps.editorId], {})
  const isEditing = isTruthy(editEntity)
  return {
    statement,
    isFetching,
    isEditing,
  }
}

export default connect(mapStateToProps, mapActionCreatorGroupToDispatchToProps({
  editors,
}))(EditableStatement)