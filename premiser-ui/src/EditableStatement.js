import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {connect} from "react-redux";
import CircularProgress from "react-md/lib/Progress/CircularProgress";
import get from 'lodash/get'

import {EditorTypes} from "./reducers/editors";
import StatementViewer from "./StatementViewer";
import StatementEditor from "./StatementEditor";

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
        <StatementEditor editorId={editorId}
                         id={id}
                         suggestionsKey={suggestionsKey}
                         {...rest}
        />
    const viewer =
        <StatementViewer id={id}
                         statement={statement}
                         {...rest}
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
  const editEntity = get(state.editors, [EditorTypes.STATEMENT, ownProps.editorId, 'editEntity'])
  const isEditing = !!editEntity
  return {
    statement,
    isEditing,
  }
}

export default connect(mapStateToProps)(EditableStatement)