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
import queryString from 'query-string'

import {
  makeNewStatementJustification,
  JustificationBasisType,
  makeNewJustificationBasisCompoundFromWritQuote,
  StatementTagVotePolarity
} from "howdju-common"

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
import {
  translateNewJustificationErrors,
  combineIds,
  combineNames,
  combineSuggestionsKeys,
} from './viewModels'
import NewJustificationEditorFields from "./NewJustificationEditorFields"
import StatementEditorFields from "./StatementEditorFields"
import {EditorTypes} from "./reducers/editors"
import paths from './paths'
import TagsControl from './TagsControl'


export const CreateStatementPageMode = {
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
  [CreateStatementPageMode.CREATE_STATEMENT]: CREATE_STATEMENT_TITLE,
  [CreateStatementPageMode.CREATE_JUSTIFICATION]: CREATE_JUSTIFICATION_TITLE,
  [CreateStatementPageMode.SUBMIT_JUSTIFICATION]: CREATE_JUSTIFICATION_TITLE,
}
const submitButtonLabelTextKeyByMode = {
  [CreateStatementPageMode.CREATE_STATEMENT]: CREATE_STATEMENT_SUBMIT_BUTTON_LABEL,
  [CreateStatementPageMode.CREATE_JUSTIFICATION]: CREATE_JUSTIFICATION_SUBMIT_BUTTON_LABEL,
  [CreateStatementPageMode.SUBMIT_JUSTIFICATION]: CREATE_JUSTIFICATION_SUBMIT_BUTTON_LABEL,
}
const submitButtonTitleTextKeyByMode = {
  [CreateStatementPageMode.CREATE_STATEMENT]: CREATE_STATEMENT_SUBMIT_BUTTON_TITLE,
  [CreateStatementPageMode.CREATE_JUSTIFICATION]: CREATE_JUSTIFICATION_SUBMIT_BUTTON_TITLE,
  [CreateStatementPageMode.SUBMIT_JUSTIFICATION]: CREATE_JUSTIFICATION_SUBMIT_BUTTON_TITLE,
}

const statementName = 'statement'
const tagsName = 'tags'
const doCreateJustificationName = 'doCreateJustification'
const newJustificationName = 'newJustification'

class CreateStatementPage extends Component {

  componentWillMount() {
    this.initializeEditor()
  }

  initializeEditor = () => {
    switch (this.props.mode) {
      case CreateStatementPageMode.CREATE_STATEMENT:
        this.props.editors.beginEdit(CreateStatementPage.editorType, CreateStatementPage.editorId, makeNewStatementJustification())
        break
      case CreateStatementPageMode.CREATE_JUSTIFICATION: {
        const {
          basisSourceType,
          basisSourceId,
        } = this.props.queryParams
        // First clear out the editor
        this.props.editors.cancelEdit(CreateStatementPage.editorType, CreateStatementPage.editorId)
        // Then fetch the stuff for editing
        this.props.flows.fetchAndBeginEditOfNewJustificationFromBasisSource(CreateStatementPage.editorType,
          CreateStatementPage.editorId, basisSourceType, basisSourceId)
        break
      }
      case CreateStatementPageMode.SUBMIT_JUSTIFICATION: {
        const {
          url,
          description,
          quoteText,
        } = this.props.queryParams

        const writQuote = {
          quoteText,
          writ: {
            title: description
          },
          urls: [{url}]
        }
        const justificationProps = {
          basis: {
            type: JustificationBasisType.WRIT_QUOTE,
            writQuote,
            justificationBasisCompound: makeNewJustificationBasisCompoundFromWritQuote(writQuote),
          }
        }

        this.props.editors.beginEdit(CreateStatementPage.editorType, CreateStatementPage.editorId,
          makeNewStatementJustification({}, justificationProps))
        break
      }
    }
  }

  onPropertyChange = (properties) => {
    this.props.editors.propertyChange(CreateStatementPage.editorType, CreateStatementPage.editorId, properties)
  }

  addJustificationUrl = () => {
    this.props.editors.addUrl(CreateStatementPage.editorType, CreateStatementPage.editorId)
  }

  removeJustificationUrl = (url, index) => {
    this.props.editors.removeUrl(CreateStatementPage.editorType, CreateStatementPage.editorId, url, index)
  }

  addJustificationStatementCompoundAtom = (index) => {
    this.props.editors.addStatementCompoundAtom(CreateStatementPage.editorType, CreateStatementPage.editorId, index)
  }

  removeJustificationStatementCompoundAtom = (atom, index) => {
    this.props.editors.removeStatementCompoundAtom(CreateStatementPage.editorType, CreateStatementPage.editorId, atom, index)
  }

  addJustificationBasisCompoundAtom = (index) => {
    this.props.editors.addJustificationBasisCompoundAtom(CreateStatementPage.editorType, CreateStatementPage.editorId, index)
  }

  removeJustificationBasisCompoundAtom = (atom, index) => {
    this.props.editors.removeJustificationBasisCompoundAtom(CreateStatementPage.editorType, CreateStatementPage.editorId, atom, index)
  }

  onAddJustificationBasisCompoundAtomSourceExcerptParaphraseWritQuoteUrl = (atomIndex, urlIndex) => {
    this.props.editors.addJustificationBasisCompoundAtomSourceExcerptParaphraseWritQuoteUrl(CreateStatementPage.editorType,
      CreateStatementPage.editorId, atomIndex, urlIndex)
  }

  onRemoveJustificationBasisCompoundAtomSourceExcerptParaphraseWritQuoteUrl = (atom, atomIndex, url, urlIndex) => {
    this.props.editors.removeJustificationBasisCompoundAtomSourceExcerptParaphraseWritQuoteUrl(CreateStatementPage.editorType,
      CreateStatementPage.editorId, atom, atomIndex, url, urlIndex)
  }

  onDoCreateJustificationSwitchChange = (checked) => {
    this.props.editors.propertyChange(CreateStatementPage.editorType, CreateStatementPage.editorId, {[doCreateJustificationName]: checked})
  }

  onTagStatement = (tag) => {
    this.props.editors.tagStatement(CreateStatementPage.editorType, CreateStatementPage.editorId, tag)
  }

  onUnTagStatement = (tag) => {
    this.props.editors.unTagStatement(CreateStatementPage.editorType, CreateStatementPage.editorId, tag)
  }

  onSubmit = (event) => {
    event.preventDefault()
    this.props.flows.commitEditThenView(CreateStatementPage.editorType, CreateStatementPage.editorId)
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

    const id = CreateStatementPage.id

    const title = t(titleTextKeyByMode[mode])
    const submitButtonLabel = t(submitButtonLabelTextKeyByMode[mode])
    const submitButtonTitle = t(submitButtonTitleTextKeyByMode[mode])

    const isCreateJustificationMode = mode === CreateStatementPageMode.CREATE_JUSTIFICATION

    const statementErrors = errors && (
      doCreateJustification ?
        get(errors, 'justification.fieldErrors.target.fieldErrors.entity') :
        errors.statement
    )
    const justificationErrors = errors && doCreateJustification ? errors.justification : null
    const newJustificationErrors = translateNewJustificationErrors(newJustification, justificationErrors)

    const statementTags = get(statement, 'tags')
    const statementTagVotes = get(statement, 'statementTagVotes')

    const statementEditorText = 'statementEditorText'

    return (
      <div id="edit-statement-justification-page">
        <Helmet>
          <title>{title} — Howdju</title>
        </Helmet>
        {mode === CreateStatementPageMode.CREATE_STATEMENT && (
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
                    <StatementEditorFields
                      id={combineIds(id, statementName)}
                      textId={statementEditorText}
                      statement={statement}
                      name={statementName}
                      suggestionsKey={combineSuggestionsKeys(id, statementName)}
                      onPropertyChange={this.onPropertyChange}
                      errors={statementErrors}
                      disabled={isSaving}
                      onSubmit={this.onSubmit}
                    />
                    <TagsControl
                      id={combineIds(id, tagsName)}
                      tags={statementTags}
                      votes={statementTagVotes}
                      name={combineNames(statementName, tagsName)}
                      suggestionsKey={combineSuggestionsKeys(id, tagsName)}
                      votePolarity={{
                        POSITIVE: StatementTagVotePolarity.POSITIVE,
                        NEGATIVE: StatementTagVotePolarity.NEGATIVE,
                      }}
                      onTag={this.onTagStatement}
                      onUnTag={this.onUnTagStatement}
                      onSubmit={this.onSubmit}
                    />
                  </CardText>

                  {!isCreateJustificationMode && (
                    <Switch
                      id={combineIds(id, doCreateJustificationName)}
                      name={doCreateJustificationName}
                      label={t(ADD_JUSTIFICATION_TO_CREATE_STATEMENT)}
                      checked={doCreateJustification}
                      onChange={this.onDoCreateJustificationSwitchChange}
                      disabled={isSaving}
                    />
                  )}

                  <CardTitle
                    title={t(JUSTIFICATION_TITLE)}
                    className={cn({hidden: !isCreateJustificationMode && !doCreateJustification})}
                  />

                  <CardText className={cn({hidden: !isCreateJustificationMode && !doCreateJustification})}>
                    <NewJustificationEditorFields
                      newJustification={newJustification}
                      id={combineIds(id, newJustificationName)}
                      name={newJustificationName}
                      suggestionsKey={combineSuggestionsKeys(id, newJustificationName)}
                      disabled={isSaving}
                      onPropertyChange={this.onPropertyChange}
                      onSubmit={this.onSubmit}
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
                    <Button
                      flat
                      label="Cancel"
                      disabled={isSaving}
                      onClick={this.onCancel}
                    />
                    <Button
                      raised
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
CreateStatementPage.id = 'create-statement-page'
CreateStatementPage.editorType = EditorTypes.STATEMENT_JUSTIFICATION
CreateStatementPage.editorId = CreateStatementPage.id

const mapStateToProps = (state, ownProps) => {
  const editorState = get(state.editors, [CreateStatementPage.editorType, CreateStatementPage.editorId], {})
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
}))(CreateStatementPage)