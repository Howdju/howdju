import React, {Component} from "react"
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import {goBack} from "react-router-redux"
import Helmet from 'react-helmet'
import {
  Button,
  Card,
  CardTitle,
  CardActions,
  CardText,
  CircularProgress,
  FocusContainer,
  FontIcon,
  Switch,
} from 'react-md'
import cn from 'classnames'
import get from 'lodash/get'
import map from 'lodash/map'
import queryString from 'query-string'

import {
  arrayToObject,
  makeNewPropositionJustification,
  JustificationBasisType,
  makeNewJustificationBasisCompoundFromWritQuote,
  PropositionTagVotePolarity
} from "howdju-common"

import {
  editors,
  flows,
  mapActionCreatorGroupToDispatchToProps,
} from './actions'
import paths from './paths'
import t, {
  ADD_JUSTIFICATION_TO_CREATE_PROPOSITION,
  CREATE_JUSTIFICATION_SUBMIT_BUTTON_LABEL,
  CREATE_JUSTIFICATION_SUBMIT_BUTTON_TITLE, CREATE_JUSTIFICATION_TITLE,
  CREATE_PROPOSITION_SUBMIT_BUTTON_LABEL,
  CREATE_PROPOSITION_SUBMIT_BUTTON_TITLE, CREATE_PROPOSITION_TITLE, JUSTIFICATION_TITLE,
} from "./texts"
import {
  translateNewJustificationErrors,
  combineIds,
  combineNames,
  combineSuggestionsKeys, array,
} from './viewModels'
import NewJustificationEditorFields from "./NewJustificationEditorFields"
import PropositionEditorFields from "./PropositionEditorFields"
import {EditorTypes} from "./reducers/editors"
import TagsControl from './TagsControl'
import {logger} from './logger'
import PersorgEditorFields from './PersorgEditorFields'
import EntityViewer from './EntityViewer'


export const CreatePropositionPageMode = arrayToObject([
  /** Blank editors, optionally show and create a justification with the proposition */
  'CREATE_PROPOSITION',

  /** Blank proposition editor, pre-populated justification information.  Supports receiving
   * basisSourceType/basisSourceId as query parameters, or if both of these are missing, expects
   * editor to have been pre-populated with propositionJustification (e.g. the browser extension passes information
   * via a window.postMessage.)
   *
   * Hides the create-justification switch.
   */
  'CREATE_JUSTIFICATION',

  /** Submit writ quote-based justification via query params */
  'SUBMIT_JUSTIFICATION_VIA_QUERY_STRING',
])

const titleTextKeyByMode = {
  [CreatePropositionPageMode.CREATE_PROPOSITION]: CREATE_PROPOSITION_TITLE,
  [CreatePropositionPageMode.CREATE_JUSTIFICATION]: CREATE_JUSTIFICATION_TITLE,
  [CreatePropositionPageMode.SUBMIT_JUSTIFICATION_VIA_QUERY_STRING]: CREATE_JUSTIFICATION_TITLE,
}
const submitButtonLabelTextKeyByMode = {
  [CreatePropositionPageMode.CREATE_PROPOSITION]: CREATE_PROPOSITION_SUBMIT_BUTTON_LABEL,
  [CreatePropositionPageMode.CREATE_JUSTIFICATION]: CREATE_JUSTIFICATION_SUBMIT_BUTTON_LABEL,
  [CreatePropositionPageMode.SUBMIT_JUSTIFICATION_VIA_QUERY_STRING]: CREATE_JUSTIFICATION_SUBMIT_BUTTON_LABEL,
}
const submitButtonTitleTextKeyByMode = {
  [CreatePropositionPageMode.CREATE_PROPOSITION]: CREATE_PROPOSITION_SUBMIT_BUTTON_TITLE,
  [CreatePropositionPageMode.CREATE_JUSTIFICATION]: CREATE_JUSTIFICATION_SUBMIT_BUTTON_TITLE,
  [CreatePropositionPageMode.SUBMIT_JUSTIFICATION_VIA_QUERY_STRING]: CREATE_JUSTIFICATION_SUBMIT_BUTTON_TITLE,
}

const propositionName = 'proposition'
const speakersName = 'speakers'
const tagsName = 'tags'
const doCreateJustificationName = 'doCreateJustification'
const newJustificationName = 'newJustification'

class CreatePropositionPage extends Component {

  static id = 'create-proposition-page'
  static editorType = EditorTypes.PROPOSITION_JUSTIFICATION
  static editorId = CreatePropositionPage.id

  componentDidMount() {
    this.initializeEditor()
  }

  initializeEditor = () => {
    switch (this.props.mode) {
      case CreatePropositionPageMode.CREATE_PROPOSITION:
        this.props.editors.beginEdit(CreatePropositionPage.editorType, CreatePropositionPage.editorId, makeNewPropositionJustification())
        break
      case CreatePropositionPageMode.CREATE_JUSTIFICATION: {
        const {
          basisSourceType,
          basisSourceId,
        } = this.props.queryParams
        if (basisSourceType || basisSourceId) {
          // First clear out the editor
          this.props.editors.cancelEdit(CreatePropositionPage.editorType, CreatePropositionPage.editorId)

          if (!(basisSourceType && basisSourceId)) {
            logger.error(`If either of basisSourceType/basisSourceId are present, both must be: basisSourceType: ${basisSourceType} basisSourceId: ${basisSourceId}.`)
            return
          }

          // Then fetch the stuff for editing
          this.props.flows.fetchAndBeginEditOfNewJustificationFromBasisSource(CreatePropositionPage.editorType,
            CreatePropositionPage.editorId, basisSourceType, basisSourceId)
        }
        // if neither basisSourceType or basisSourceId is present in the queryParams, then the editorModel should
        // already be present, e.g. from the browser extension.  We could check that here, I think.
        break
      }
      case CreatePropositionPageMode.SUBMIT_JUSTIFICATION_VIA_QUERY_STRING: {
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
        const propositionJustification = makeNewPropositionJustification({}, justificationProps)
        this.props.editors.beginEdit(CreatePropositionPage.editorType, CreatePropositionPage.editorId,
          propositionJustification)
        break
      }
      default: {
        logger.warning(`unsupported CreatePropositionPageMode: ${this.props.mode}`)
      }
    }
  }

  onAddSpeakerClick = () => {
    this.props.editors.addSpeaker(CreatePropositionPage.editorType, CreatePropositionPage.editorId)
  }

  onRemoveSpeakerClick = (speaker, index) => {
    this.props.editors.removeSpeaker(CreatePropositionPage.editorType, CreatePropositionPage.editorId, speaker, index)
  }

  onPersorgAutocomplete = (persorg, index) => {
    this.props.editors.replaceSpeaker(CreatePropositionPage.editorType, CreatePropositionPage.editorId, persorg, index)
  }

  onPropertyChange = (properties) => {
    this.props.editors.propertyChange(CreatePropositionPage.editorType, CreatePropositionPage.editorId, properties)
  }

  addJustificationUrl = () => {
    this.props.editors.addUrl(CreatePropositionPage.editorType, CreatePropositionPage.editorId)
  }

  removeJustificationUrl = (url, index) => {
    this.props.editors.removeUrl(CreatePropositionPage.editorType, CreatePropositionPage.editorId, url, index)
  }

  addJustificationPropositionCompoundAtom = (index) => {
    this.props.editors.addPropositionCompoundAtom(CreatePropositionPage.editorType, CreatePropositionPage.editorId, index)
  }

  removeJustificationPropositionCompoundAtom = (atom, index) => {
    this.props.editors.removePropositionCompoundAtom(CreatePropositionPage.editorType, CreatePropositionPage.editorId, atom, index)
  }

  addJustificationBasisCompoundAtom = (index) => {
    this.props.editors.addJustificationBasisCompoundAtom(CreatePropositionPage.editorType, CreatePropositionPage.editorId, index)
  }

  removeJustificationBasisCompoundAtom = (atom, index) => {
    this.props.editors.removeJustificationBasisCompoundAtom(CreatePropositionPage.editorType, CreatePropositionPage.editorId, atom, index)
  }

  onAddJustificationBasisCompoundAtomSourceExcerptParaphraseWritQuoteUrl = (atomIndex, urlIndex) => {
    this.props.editors.addJustificationBasisCompoundAtomSourceExcerptParaphraseWritQuoteUrl(CreatePropositionPage.editorType,
      CreatePropositionPage.editorId, atomIndex, urlIndex)
  }

  onRemoveJustificationBasisCompoundAtomSourceExcerptParaphraseWritQuoteUrl = (atom, atomIndex, url, urlIndex) => {
    this.props.editors.removeJustificationBasisCompoundAtomSourceExcerptParaphraseWritQuoteUrl(CreatePropositionPage.editorType,
      CreatePropositionPage.editorId, atom, atomIndex, url, urlIndex)
  }

  onDoCreateJustificationSwitchChange = (checked) => {
    this.props.editors.propertyChange(CreatePropositionPage.editorType, CreatePropositionPage.editorId, {[doCreateJustificationName]: checked})
  }

  onTagProposition = (tag) => {
    this.props.editors.tagProposition(CreatePropositionPage.editorType, CreatePropositionPage.editorId, tag)
  }

  onUnTagProposition = (tag) => {
    this.props.editors.unTagProposition(CreatePropositionPage.editorType, CreatePropositionPage.editorId, tag)
  }

  onSubmit = (event) => {
    event.preventDefault()
    this.props.flows.commitEditThenView(CreatePropositionPage.editorType, CreatePropositionPage.editorId)
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
      proposition,
      speakers,
      newJustification,
      doCreateJustification,
    } = editEntity || {}

    // const isEditing = !!editEntity

    const id = CreatePropositionPage.id

    const title = t(titleTextKeyByMode[mode])
    const submitButtonLabel = t(submitButtonLabelTextKeyByMode[mode])
    const submitButtonTitle = t(submitButtonTitleTextKeyByMode[mode])

    const isCreateJustificationMode = mode === CreatePropositionPageMode.CREATE_JUSTIFICATION

    const propositionErrors = errors && (
      doCreateJustification ?
        get(errors, 'justification.fieldErrors.target.fieldErrors.entity') :
        errors.proposition
    )
    const justificationErrors = errors && doCreateJustification ? errors.justification : null
    const newJustificationErrors = translateNewJustificationErrors(newJustification, justificationErrors)

    const propositionTags = get(proposition, 'tags')
    const propositionTagVotes = get(proposition, 'propositionTagVotes')

    const propositionEditorText = 'propositionEditorText'

    const hasSpeakers = speakers && speakers.length > 0
    
    const doShowTypeSelection = !isCreateJustificationMode

    return (
      <div id="edit-proposition-justification-page">
        <Helmet>
          <title>{title} — Howdju</title>
        </Helmet>
        {mode === CreatePropositionPageMode.CREATE_PROPOSITION && (
          <div className="md-grid">
            <div className="md-cell md-cell--12">
              <p>
                The <Link to={paths.tools()}>Chrome extension & bookmarklet</Link> are convenient ways to create 
                justifications based upon web pages you visit
              </p>
            </div>
          </div>
        )}
        <form onSubmit={this.onSubmit}>
          <FocusContainer initialFocus={'#' + propositionEditorText} containFocus={false} focusOnMount={true}>
            <div className="md-grid">
              <div className="md-cell md-cell--12">

                <Card>
                  <CardTitle title={title} />

                  <CardText>
                    <Button
                      flat
                      iconEl={<FontIcon>person_add</FontIcon>}
                      title={"Add Speaker"}
                      onClick={this.onAddSpeakerClick}
                      disabled={isSaving}
                    >
                      Add Speaker
                    </Button>
                    {hasSpeakers && (
                      <div className="md-grid">
                        <div className="md-cell md-cell--6">
                          {map(speakers, (speaker, index) => (
                            <div key={index}>
                              <EntityViewer
                                iconName="person"
                                iconTitle="Person/Organization"
                                menu={(
                                  <Button
                                    icon
                                    onClick={e => this.onRemoveSpeakerClick(speaker, index)}
                                    title="Delete speaker"
                                  >delete</Button>
                                )}
                                entity={
                                  <PersorgEditorFields
                                    id={combineIds(id, speakersName, index)}
                                    key={combineIds(id, speakersName, index)}
                                    persorg={speaker}
                                    suggestionsKey={combineSuggestionsKeys(id, speakersName, index)}
                                    name={combineNames(speakersName, array(index))}
                                    disabled={isSaving}
                                    onPersorgNameAutocomplete={(persorg) => this.onPersorgAutocomplete(persorg, index)}
                                    onPropertyChange={this.onPropertyChange}
                                    onSubmit={this.onSubmit}
                                  />
                                }
                              />
                              <div>
                                Said that:
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardText>


                  <CardText>
                    <PropositionEditorFields
                      id={combineIds(id, propositionName)}
                      textId={propositionEditorText}
                      proposition={proposition}
                      name={propositionName}
                      suggestionsKey={combineSuggestionsKeys(id, propositionName)}
                      onPropertyChange={this.onPropertyChange}
                      errors={propositionErrors}
                      disabled={isSaving}
                      onSubmit={this.onSubmit}
                    />
                    <TagsControl
                      id={combineIds(id, tagsName)}
                      tags={propositionTags}
                      votes={propositionTagVotes}
                      name={combineNames(propositionName, tagsName)}
                      suggestionsKey={combineSuggestionsKeys(id, tagsName)}
                      votePolarity={{
                        POSITIVE: PropositionTagVotePolarity.POSITIVE,
                        NEGATIVE: PropositionTagVotePolarity.NEGATIVE,
                      }}
                      onTag={this.onTagProposition}
                      onUnTag={this.onUnTagProposition}
                      onSubmit={this.onSubmit}
                    />
                  </CardText>

                  {!isCreateJustificationMode && (
                    <Switch
                      id={combineIds(id, doCreateJustificationName)}
                      name={doCreateJustificationName}
                      label={t(ADD_JUSTIFICATION_TO_CREATE_PROPOSITION)}
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
                      doShowTypeSelection={doShowTypeSelection}
                      onPropertyChange={this.onPropertyChange}
                      onSubmit={this.onSubmit}
                      onAddUrl={this.addJustificationUrl}
                      onRemoveUrl={this.removeJustificationUrl}
                      onAddPropositionCompoundAtom={this.addJustificationPropositionCompoundAtom}
                      onRemovePropositionCompoundAtom={this.removeJustificationPropositionCompoundAtom}
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
                      children="Cancel"
                      disabled={isSaving}
                      onClick={this.onCancel}
                    />
                    <Button
                      raised
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
      </div>
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  const editorState = get(state.editors, [CreatePropositionPage.editorType, CreatePropositionPage.editorId], {})
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
}))(CreatePropositionPage)