import React, {Component} from "react"
import { connect } from 'react-redux'
import {goBack} from "react-router-redux";
import DocumentTitle from 'react-document-title'
import Button from 'react-md/lib/Buttons/Button'
import Card from 'react-md/lib/Cards'
import CardTitle from 'react-md/lib/Cards/CardTitle';
import CardActions from 'react-md/lib/Cards/CardActions';
import CardText from 'react-md/lib/Cards/CardText';
import { Switch } from 'react-md/lib/SelectionControls'
import cn from 'classnames'
import get from 'lodash/get'
import merge from 'lodash/merge'
import queryString from 'query-string'


import {
  api,
  editors,
  flows,
  mapActionCreatorGroupToDispatchToProps,
  ui,
} from './actions'
import text, {
  default as t,
  ADD_JUSTIFICATION_TO_CREATE_STATEMENT,
  CREATE_JUSTIFICATION_SUBMIT_BUTTON_LABEL,
  CREATE_JUSTIFICATION_SUBMIT_BUTTON_TITLE, CREATE_JUSTIFICATION_TITLE,
  CREATE_STATEMENT_SUBMIT_BUTTON_LABEL,
  CREATE_STATEMENT_SUBMIT_BUTTON_TITLE, CREATE_STATEMENT_TITLE, JUSTIFICATION_TITLE,
} from "./texts";
import { suggestionKeys } from './autocompleter'
import {justificationBasisTypeToNewJustificationBasisMemberName, makeNewStatementJustification} from "./models";
import {
  editStatementJustificationPageEditorId,
} from "./editorIds"
import {logger} from "./util";
import NewJustificationEditorFields from "./NewJustificationEditorFields";
import StatementEditorFields from "./StatementEditorFields";
import {EditorTypes} from "./reducers/editors";
import ErrorMessages from "./ErrorMessages";

export const EditStatementJustificationPageMode = {
  /** Blank editors, optionally show and create a justification with the statement */
  CREATE_STATEMENT: 'CREATE_STATEMENT',
  /** Blank statement editor, pre-populated justification information (e.g. citation reference from bookmarklet)
   *
   * Hide the citation switch.
   */
  CREATE_JUSTIFICATION: 'CREATE_JUSTIFICATION',
}

const titleTextKeyByMode = {
  [EditStatementJustificationPageMode.CREATE_STATEMENT]: CREATE_STATEMENT_TITLE,
  [EditStatementJustificationPageMode.CREATE_JUSTIFICATION]: CREATE_JUSTIFICATION_TITLE,
}
const submitButtonLabelTextKeyByMode = {
  [EditStatementJustificationPageMode.CREATE_STATEMENT]: CREATE_STATEMENT_SUBMIT_BUTTON_LABEL,
  [EditStatementJustificationPageMode.CREATE_JUSTIFICATION]: CREATE_JUSTIFICATION_SUBMIT_BUTTON_LABEL,
}
const submitButtonTitleTextKeyByMode = {
  [EditStatementJustificationPageMode.CREATE_STATEMENT]: CREATE_STATEMENT_SUBMIT_BUTTON_TITLE,
  [EditStatementJustificationPageMode.CREATE_JUSTIFICATION]: CREATE_JUSTIFICATION_SUBMIT_BUTTON_TITLE,
}

const justificationErrorsToNewJustificationErrors = (justification, errors) => {
  // TODO equivalent logic exists in editors.NEW_JUSTIFICATION reducer
  if (!justification || !errors) {
    return errors
  }
  const justificationBasisType = justification.basis.type
  const newJustificationBasisMemberName = justificationBasisTypeToNewJustificationBasisMemberName(justificationBasisType)
  const newJustificationBasisErrors = {fieldErrors: {basis: {fieldErrors: {[newJustificationBasisMemberName]: errors.fieldErrors.basis.fieldErrors.entity} } } }
  const newJustificationErrors = merge({}, errors, newJustificationBasisErrors, {fieldErrors: {basis: {fieldErrors: {entity: undefined}}}})
  return newJustificationErrors
}

class EditStatementJustificationPage extends Component {

  constructor() {
    super()

    this.onPropertyChange = this.onPropertyChange.bind(this)
    this.addJustificationUrl = this.addJustificationUrl.bind(this)
    this.deleteJustificationUrl = this.deleteJustificationUrl.bind(this)
    this.onDoCreateJustificationSwitchChange = this.onDoCreateJustificationSwitchChange.bind(this)
    this.onSubmit = this.onSubmit.bind(this)
    this.onCancel = this.onCancel.bind(this)

    this.editorId = editStatementJustificationPageEditorId
    this.editorType = EditorTypes.STATEMENT_JUSTIFICATION
  }

  componentWillMount() {
    switch (this.props.mode) {
      case EditStatementJustificationPageMode.CREATE_STATEMENT:
        this.props.editors.beginEdit(this.editorType, this.editorId, makeNewStatementJustification())
        break
      case EditStatementJustificationPageMode.CREATE_JUSTIFICATION:
        const {
          basisType,
          basisId,
        } = this.props.queryParams
        this.props.flows.fetchAndBeginEditOfNewJustificationFromBasis(this.editorType, this.editorId, basisType, basisId)
        break
    }
  }

  onPropertyChange(properties) {
    this.props.editors.propertyChange(this.editorType, this.editorId, properties)
  }

  addJustificationUrl() {
    this.props.editors.addUrl(this.editorType, this.editorId)
  }

  deleteJustificationUrl(url, index) {
    this.props.editors.deleteUrl(this.editorType, this.editorId, url, index)
  }

  onDoCreateJustificationSwitchChange(checked) {
    this.props.editors.propertyChange(this.editorType, this.editorId, {doCreateJustification: checked})
  }

  onSubmit(event) {
    event.preventDefault()
    this.props.flows.commitEditThenView(this.editorType, this.editorId)
  }

  onCancel() {
    this.props.goBack()
  }

  render() {
    const {
      mode,
      isEditing,
      editEntity,
      inProgress,
      errors,
    } = this.props
    const {
      statement,
      justification,
      doCreateJustification,
    } = editEntity

    const title = text(titleTextKeyByMode[mode])
    const submitButtonLabel = text(submitButtonLabelTextKeyByMode[mode])
    const submitButtonTitle = text(submitButtonTitleTextKeyByMode[mode])

    const isCreateJustification = mode === EditStatementJustificationPageMode.CREATE_JUSTIFICATION

    const statementErrors = errors && (
        doCreateJustification ?
            errors.justification.fieldErrors.target.fieldErrors.entity :
            errors.statement
        )
    const justificationErrors = errors && doCreateJustification ? errors.justification : null
    const newJustificationErrors = justificationErrorsToNewJustificationErrors(justification, justificationErrors)

    return (
        <DocumentTitle title={`Howdju - ${title}`}>
          <form onSubmit={this.onSubmit}>
            <div id="addStatementPage" className="md-grid">
              <div className="md-cell md-cell--12">

                <Card>
                  <CardTitle title={title} />

                  <CardText>
                    {statement &&
                      <StatementEditorFields statement={statement}
                                             id="statement"
                                             name="statement"
                                             suggestionsKey={suggestionKeys.createStatementPageStatement}
                                             onPropertyChange={this.onPropertyChange}
                                             errors={statementErrors}
                      />
                    }
                  </CardText>

                  {isEditing &&
                    <Switch id="doCreateJustificationSwitch"
                            name="doCreateJustification"
                            label={text(ADD_JUSTIFICATION_TO_CREATE_STATEMENT)}
                            className={cn({hidden: isCreateJustification})}
                            checked={doCreateJustification}
                            onChange={this.onDoCreateJustificationSwitchChange}
                    />
                  }

                  <CardTitle title={t(JUSTIFICATION_TITLE)}
                             className={cn({hidden: !isCreateJustification && !doCreateJustification})}
                  />

                  <CardText className={cn({hidden: !isCreateJustification && !doCreateJustification})}>
                    {justification &&
                      <NewJustificationEditorFields newJustification={justification}
                                                    name="justification"
                                                    suggestionsKey="justification"
                                                    readOnlyBasis={isCreateJustification}
                                                    onPropertyChange={this.onPropertyChange}
                                                    onAddUrlClick={this.addJustificationUrl}
                                                    onDeleteUrlClick={this.deleteJustificationUrl}
                                                    errors={newJustificationErrors}
                      />
                    }
                  </CardText>

                  <CardActions>
                    <Button raised
                            primary
                            type="submit"
                            label={submitButtonLabel}
                            title={submitButtonTitle}
                            disabled={inProgress}
                    />
                    <Button flat
                            label="Cancel"
                            disabled={inProgress}
                            onClick={this.onCancel}
                    />
                  </CardActions>

                </Card>

              </div>
            </div>
          </form>
        </DocumentTitle>
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  const editorState = get(state.editors, [EditorTypes.STATEMENT_JUSTIFICATION, editStatementJustificationPageEditorId], {})
  const errors = editorState.errors
  const editEntity = get(editorState, 'editEntity') || {}
  const queryParams = queryString.parse(ownProps.location.search)
  return {
    editEntity,
    isEditing: !!editEntity,
    errors,
    queryParams,
  }
}

export default connect(mapStateToProps, mapActionCreatorGroupToDispatchToProps({
  api,
  editors,
  ui,
  flows,
}, {
  goBack,
}))(EditStatementJustificationPage)