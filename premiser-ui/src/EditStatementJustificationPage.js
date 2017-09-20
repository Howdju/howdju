import React, {Component} from "react"
import { connect } from 'react-redux'
import {goBack} from "react-router-redux"
import { Link } from 'react-router-dom'
import Helmet from 'react-helmet'
import Button from 'react-md/lib/Buttons/Button'
import Card from 'react-md/lib/Cards'
import CardTitle from 'react-md/lib/Cards/CardTitle'
import CardActions from 'react-md/lib/Cards/CardActions'
import CardText from 'react-md/lib/Cards/CardText'
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
import t, {
  ADD_JUSTIFICATION_TO_CREATE_STATEMENT,
  CREATE_JUSTIFICATION_SUBMIT_BUTTON_LABEL,
  CREATE_JUSTIFICATION_SUBMIT_BUTTON_TITLE, CREATE_JUSTIFICATION_TITLE,
  CREATE_STATEMENT_SUBMIT_BUTTON_LABEL,
  CREATE_STATEMENT_SUBMIT_BUTTON_TITLE, CREATE_STATEMENT_TITLE, JUSTIFICATION_TITLE,
} from "./texts"
import { suggestionKeys } from './autocompleter'
import {
  makeNewStatementJustification,
  JustificationBasisType,
} from "howdju-common"
import {justificationBasisTypeToNewJustificationBasisMemberName} from './viewModels'
import {
  editStatementJustificationPageEditorId,
} from "./editorIds"
import NewJustificationEditorFields from "./NewJustificationEditorFields"
import StatementEditorFields from "./StatementEditorFields"
import {EditorTypes} from "./reducers/editors"
import paths from './paths'

export const EditStatementJustificationPageMode = {
  /** Blank editors, optionally show and create a justification with the statement */
  CREATE_STATEMENT: 'CREATE_STATEMENT',
  /** Blank statement editor, pre-populated justification information (e.g. writ quote from bookmarklet)
   *
   * Hide the writ switch.
   */
  CREATE_JUSTIFICATION: 'CREATE_JUSTIFICATION',
  /** Submit writ quote-based justification via query params */
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

    this.editorId = editStatementJustificationPageEditorId
    this.editorType = EditorTypes.STATEMENT_JUSTIFICATION
  }

  componentWillMount() {
    this.initializeEditor()
  }

  initializeEditor = () => {
    switch (this.props.mode) {
      case EditStatementJustificationPageMode.CREATE_STATEMENT:
        this.props.editors.beginEdit(this.editorType, this.editorId, makeNewStatementJustification())
        break
      case EditStatementJustificationPageMode.CREATE_JUSTIFICATION: {
        const {
          basisType,
          basisId,
        } = this.props.queryParams
        // First clear out the editor
        this.props.editors.beginEdit(this.editorType, this.editorId, makeNewStatementJustification())
        // Then fetch the stuff for editing
        this.props.flows.fetchAndBeginEditOfNewJustificationFromBasisSource(this.editorType, this.editorId, basisType, basisId)
        break
      }
      case EditStatementJustificationPageMode.SUBMIT_JUSTIFICATION: {
        const {
          url,
          title,
          quoteText,
        } = this.props.queryParams
        this.props.editors.beginEdit(this.editorType, this.editorId, makeNewStatementJustification({}, {
          basis: {
            type: JustificationBasisType.WRIT_QUOTE,
            writQuote: {
              quoteText,
              writ: {
                title
              },
              urls: [{url}]
            }
          }
        }))
        break
      }
    }
  }

  onPropertyChange = (properties) => {
    this.props.editors.propertyChange(this.editorType, this.editorId, properties)
  }

  addJustificationUrl = () => {
    this.props.editors.addUrl(this.editorType, this.editorId)
  }

  removeJustificationUrl = (url, index) => {
    this.props.editors.removeUrl(this.editorType, this.editorId, url, index)
  }

  addJustificationStatementCompoundAtom = (index) => {
    this.props.editors.addStatementCompoundAtom(this.editorType, this.editorId, index)
  }

  removeJustificationStatementCompoundAtom = (atom, index) => {
    this.props.editors.removeStatementCompoundAtom(this.editorType, this.editorId, atom, index)
  }

  addJustificationBasisCompoundAtom = (index) => {
    this.props.editors.addJustificationBasisCompoundAtom(this.editorType, this.editorId, index)
  }

  removeJustificationBasisCompoundAtom = (atom, index) => {
    this.props.editors.removeJustificationBasisCompoundAtom(this.editorType, this.editorId, atom, index)
  }

  onAddJustificationBasisCompoundAtomSourceExcerptParaphraseWritQuoteUrl = (atomIndex, urlIndex) => {
    this.props.editors.addJustificationBasisCompoundAtomSourceExcerptParaphraseWritQuoteUrl(this.editorType,
      this.editorId, atomIndex, urlIndex)
  }

  onRemoveJustificationBasisCompoundAtomSourceExcerptParaphraseWritQuoteUrl = (atom, atomIndex, url, urlIndex) => {
    this.props.editors.removeJustificationBasisCompoundAtomSourceExcerptParaphraseWritQuoteUrl(this.editorType,
      this.editorId, atom, atomIndex, url, urlIndex)
  }

  onDoCreateJustificationSwitchChange = (checked) => {
    this.props.editors.propertyChange(this.editorType, this.editorId, {doCreateJustification: checked})
  }

  onSubmit = (event) => {
    event.preventDefault()
    this.props.flows.commitEditThenView(this.editorType, this.editorId)
  }

  onCancel = () => {
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
      newJustification,
      doCreateJustification,
    } = editEntity || {}

    // const isEditing = !!editEntity

    const title = t(titleTextKeyByMode[mode])
    const submitButtonLabel = t(submitButtonLabelTextKeyByMode[mode])
    const submitButtonTitle = t(submitButtonTitleTextKeyByMode[mode])

    const isCreateJustificationMode = mode === EditStatementJustificationPageMode.CREATE_JUSTIFICATION

    const statementErrors = errors && (
      doCreateJustification ?
        get(errors, 'justification.fieldErrors.target.fieldErrors.entity') :
        errors.statement
    )
    const justificationErrors = errors && doCreateJustification ? errors.justification : null
    const newJustificationErrors = justificationErrorsToNewJustificationErrors(newJustification, justificationErrors)

    const statementEditorText = 'statementEditorText'

    return (
      <div id="edit-statement-justification-page">
        <Helmet>
          <title>{title} — Howdju</title>
        </Helmet>
        {mode === EditStatementJustificationPageMode.CREATE_STATEMENT && (
          <div className="md-grid">
            <div className="md-cell md-cell--12">
              <p>
                Please note that the <Link to={paths.tools()}>bookmarklet</Link> is a convenient way to create new justifications
                based upon web pages you visit
              </p>
            </div>
          </div>
        )}
        <form onSubmit={this.onSubmit}>
          <FocusContainer initialFocus={'#' + statementEditorText} containFocus={false} focusOnMount={true}>
            <div className="md-grid">
              <div className="md-cell md-cell--12">

                <Card>
                  <CardTitle title={title} />

                  <CardText>
                    <StatementEditorFields id={EditStatementJustificationPage.id + '-statement-editor-fields'}
                                           textId={statementEditorText}
                                           statement={statement}
                                           name="statement"
                                           suggestionsKey={suggestionKeys.createStatementPageStatement}
                                           onPropertyChange={this.onPropertyChange}
                                           errors={statementErrors}
                                           disabled={isSaving}
                    />
                  </CardText>

                  {!isCreateJustificationMode && (
                    <Switch id="doCreateJustificationSwitch"
                            name="doCreateJustification"
                            label={t(ADD_JUSTIFICATION_TO_CREATE_STATEMENT)}
                            checked={doCreateJustification}
                            onChange={this.onDoCreateJustificationSwitchChange}
                            disabled={isSaving}
                    />
                  )}

                  <CardTitle title={t(JUSTIFICATION_TITLE)}
                             className={cn({hidden: !isCreateJustificationMode && !doCreateJustification})}
                  />

                  <CardText className={cn({hidden: !isCreateJustificationMode && !doCreateJustification})}>
                    <NewJustificationEditorFields
                      newJustification={newJustification}
                      id="newJustificationEditor"
                      name="newJustification"
                      suggestionsKey={suggestionKeys.createStatementPageJustification}
                      disabled={isSaving}
                      onPropertyChange={this.onPropertyChange}
                      onAddUrl={this.addJustificationUrl}
                      onRemoveUrl={this.removeJustificationUrl}
                      onAddStatementCompoundAtom={this.addJustificationStatementCompoundAtom}
                      onRemoveStatementCompoundAtom={this.removeJustificationStatementCompoundAtom}
                      onAddJustificationBasisCompoundAtom={this.addJustificationBasisCompoundAtom}
                      onRemoveJustificationBasisCompoundAtom={this.removeJustificationBasisCompoundAtom}
                      onAddJustificationBasisCompoundAtomSourceExcerptParaphraseWritQuoteUrl={this.onAddJustificationBasisCompoundAtomSourceExcerptParaphraseWritQuoteUrl}
                      onRemoveJustificationBasisCompoundAtomSourceExcerptParaphraseWritQuoteUrl={this.onRemoveJustificationBasisCompoundAtomSourceExcerptParaphraseWritQuoteUrl}
                      errors={newJustificationErrors}
                    />
                  </CardText>

                  <CardActions>
                    {isSaving && <CircularProgress key="progress" id="progress" />}
                    <Button flat
                            label="Cancel"
                            disabled={isSaving}
                            onClick={this.onCancel}
                    />
                    <Button raised
                            primary
                            type="submit"
                            label={submitButtonLabel}
                            title={submitButtonTitle}
                            disabled={isSaving}
                    />
                  </CardActions>

                </Card>

              </div>
            </div>
          </FocusContainer>
        </form>
      </div>
    )
  }
}
EditStatementJustificationPage.id = 'EditStatementJustificationPage'

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