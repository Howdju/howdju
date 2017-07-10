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
import CircularProgress from 'react-md/lib/Progress/CircularProgress'
import FocusContainer from 'react-md/lib/Helpers/FocusContainer'
import cn from 'classnames'
import get from 'lodash/get'
import merge from 'lodash/merge'
import queryString from 'query-string'


import {
  editors,
  flows,
  mapActionCreatorGroupToDispatchToProps,
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
import {
  justificationBasisTypeToNewJustificationBasisMemberName,
  makeNewStatementJustification,
  JustificationBasisType,
} from "./models";
import {
  editStatementJustificationPageEditorId,
} from "./editorIds"
import {logger} from "./util";
import NewJustificationEditorFields from "./NewJustificationEditorFields";
import StatementEditorFields from "./StatementEditorFields";
import {EditorTypes} from "./reducers/editors";

export const EditStatementJustificationPageMode = {
  /** Blank editors, optionally show and create a justification with the statement */
  CREATE_STATEMENT: 'CREATE_STATEMENT',
  /** Blank statement editor, pre-populated justification information (e.g. citation reference from bookmarklet)
   *
   * Hide the citation switch.
   */
  CREATE_JUSTIFICATION: 'CREATE_JUSTIFICATION',
  /** Submit citation reference based justification via query params */
  SUBMIT_JUSTIFICATION: 'SUBMIT_JUSTIFICATION',
}

const titleTextKeyByMode = {
  [EditStatementJustificationPageMode.CREATE_STATEMENT]: CREATE_STATEMENT_TITLE,
  [EditStatementJustificationPageMode.CREATE_JUSTIFICATION]: CREATE_JUSTIFICATION_TITLE,
  [EditStatementJustificationPageMode.SUBMIT_JUSTIFICATION]: CREATE_JUSTIFICATION_TITLE,
}
const submitButtonLabelTextKeyByMode = {
  [EditStatementJustificationPageMode.CREATE_STATEMENT]: CREATE_STATEMENT_SUBMIT_BUTTON_LABEL,
  [EditStatementJustificationPageMode.CREATE_JUSTIFICATION]: CREATE_JUSTIFICATION_SUBMIT_BUTTON_LABEL,
  [EditStatementJustificationPageMode.SUBMIT_JUSTIFICATION]: CREATE_JUSTIFICATION_SUBMIT_BUTTON_LABEL,
}
const submitButtonTitleTextKeyByMode = {
  [EditStatementJustificationPageMode.CREATE_STATEMENT]: CREATE_STATEMENT_SUBMIT_BUTTON_TITLE,
  [EditStatementJustificationPageMode.CREATE_JUSTIFICATION]: CREATE_JUSTIFICATION_SUBMIT_BUTTON_TITLE,
  [EditStatementJustificationPageMode.SUBMIT_JUSTIFICATION]: CREATE_JUSTIFICATION_SUBMIT_BUTTON_TITLE,
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
    this.removeJustificationUrl = this.removeJustificationUrl.bind(this)
    this.addJustificationStatementAtom = this.addJustificationStatementAtom.bind(this)
    this.removeJustificationStatementAtom = this.removeJustificationStatementAtom.bind(this)
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
        // First clear out the editor
        this.props.editors.beginEdit(this.editorType, this.editorId, makeNewStatementJustification())
        // Then fetch the stuff for editing
        this.props.flows.fetchAndBeginEditOfNewJustificationFromBasis(this.editorType, this.editorId, basisType, basisId)
        break
      case EditStatementJustificationPageMode.SUBMIT_JUSTIFICATION:
        const {
          url,
          description,
          quote,
          source
        } = this.props.queryParams
        this.props.editors.beginEdit(this.editorType, this.editorId, makeNewStatementJustification({}, {
          basis: {
            type: JustificationBasisType.CITATION_REFERENCE,
            citationReference: {
              quote,
              citation: {
                text: description
              },
              urls: [{url}]
            }
          }
        }))
    }
  }

  onPropertyChange(properties) {
    this.props.editors.propertyChange(this.editorType, this.editorId, properties)
  }

  addJustificationUrl() {
    this.props.editors.addUrl(this.editorType, this.editorId)
  }

  removeJustificationUrl(url, index) {
    this.props.editors.removeUrl(this.editorType, this.editorId, url, index)
  }

  addJustificationStatementAtom(index) {
    this.props.editors.addStatementAtom(this.editorType, this.editorId, index)
  }

  removeJustificationStatementAtom(statementAtom, index) {
    this.props.editors.removeStatementAtom(this.editorType, this.editorId, statementAtom, index)
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
      editorState,
    } = this.props
    const {
      errors,
      isSaving,
      editEntity,
    } = editorState
    const {
      statement,
      justification,
      doCreateJustification,
    } = editEntity || {}

    // const isEditing = !!editEntity

    const title = text(titleTextKeyByMode[mode])
    const submitButtonLabel = text(submitButtonLabelTextKeyByMode[mode])
    const submitButtonTitle = text(submitButtonTitleTextKeyByMode[mode])

    const isCreateJustification = mode === EditStatementJustificationPageMode.CREATE_JUSTIFICATION
    const isSubmitJustification = mode === EditStatementJustificationPageMode.SUBMIT_JUSTIFICATION

    const statementErrors = errors && (
        doCreateJustification ?
            get(errors, 'justification.fieldErrors.target.fieldErrors.entity') :
            errors.statement
        )
    const justificationErrors = errors && doCreateJustification ? errors.justification : null
    const newJustificationErrors = justificationErrorsToNewJustificationErrors(justification, justificationErrors)

    return (
        <DocumentTitle title={`Howdju - ${title}`}>
          <form onSubmit={this.onSubmit}>
            <FocusContainer initialFocus="#statementEditorText" containFocus={false} focusOnMount={true}>
              <div id="addStatementPage" className="md-grid">
                <div className="md-cell md-cell--12">

                  <Card>
                    <CardTitle title={title} />

                    <CardText>
                      <StatementEditorFields statement={statement}
                                             textId="statementEditorText"
                                             name="statement"
                                             suggestionsKey={suggestionKeys.createStatementPageStatement}
                                             onPropertyChange={this.onPropertyChange}
                                             errors={statementErrors}
                                             disabled={isSaving}
                      />
                    </CardText>

                    {!isCreateJustification &&
                      <Switch id="doCreateJustificationSwitch"
                              name="doCreateJustification"
                              label={text(ADD_JUSTIFICATION_TO_CREATE_STATEMENT)}
                              checked={doCreateJustification}
                              onChange={this.onDoCreateJustificationSwitchChange}
                              disabled={isSaving}
                      />
                    }

                    <CardTitle title={t(JUSTIFICATION_TITLE)}
                               className={cn({hidden: !isCreateJustification && !doCreateJustification})}
                    />

                    <CardText className={cn({hidden: !isCreateJustification && !doCreateJustification})}>
                      <NewJustificationEditorFields newJustification={justification}
                                                    id="newJustificationEditor"
                                                    basisStatementTextId="newJustificationBasisStatement"
                                                    basisCitationReferenceQuoteId="newJustificationBasisCitationReferenceQuote"
                                                    name="justification"
                                                    suggestionsKey={suggestionKeys.createStatementPageJustification}
                                                    disabled={isSaving}
                                                    onPropertyChange={this.onPropertyChange}
                                                    onAddUrl={this.addJustificationUrl}
                                                    onRemoveUrl={this.removeJustificationUrl}
                                                    onAddStatementAtom={this.addJustificationStatementAtom}
                                                    onRemoveStatementAtom={this.removeJustificationStatementAtom}
                                                    errors={newJustificationErrors}
                      />
                    </CardText>

                    <CardActions>
                      {isSaving && <CircularProgress key="progress" id="progress" />}
                      <Button flat
                              children="Cancel"
                              disabled={isSaving}
                              onClick={this.onCancel}
                      />
                      <Button raised
                              primary
                              type="submit"
                              children={submitButtonLabel}
                              title={submitButtonTitle}
                              disabled={isSaving}
                      />
                    </CardActions>

                  </Card>

                </div>
              </div>
            </FocusContainer>
          </form>
        </DocumentTitle>
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  const editorState = get(state.editors, [EditorTypes.STATEMENT_JUSTIFICATION, editStatementJustificationPageEditorId], {})
  const queryParams = queryString.parse(ownProps.location.search)
  return {
    editorState,
    queryParams,
  }
}

export default connect(mapStateToProps, mapActionCreatorGroupToDispatchToProps({
  editors,
  flows,
}, {
  goBack,
}))(EditStatementJustificationPage)