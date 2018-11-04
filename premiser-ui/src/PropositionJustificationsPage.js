import React, {Component} from "react"
import {connect} from "react-redux"
import {denormalize} from "normalizr"
import { Link } from 'react-router-dom'
import Helmet from "react-helmet"
import {
  Divider,
  FontIcon,
  MenuButton,
  ListItem,
  Button,
  CircularProgress,
  Card,
  CardText,
} from "react-md"
import cn from 'classnames'
import concat from 'lodash/concat'
import every from 'lodash/every'
import forEach from 'lodash/forEach'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import isEqual from 'lodash/isEqual'
import map from 'lodash/map'
import some from 'lodash/some'
import sortBy from "lodash/sortBy"
import split from 'lodash/split'
import take from 'lodash/take'
import queryString from 'query-string'

import {
  isVerified,
  isDisverified,
  isPositive,
  isNegative,
  JustificationBasisSourceType,
  JustificationPolarity,
  JustificationRootTargetType,
  makeNewProposition,
  makeNewTrunkJustification,
} from "howdju-common"

import {logger} from "./logger"
import {
  api,
  editors, mapActionCreatorGroupToDispatchToProps,
  ui,
  goto, flows,
} from "./actions"
import {justificationsSchema, propositionSchema} from "./normalizationSchemas"
import paths from './paths'
import t, {
  ADD_JUSTIFICATION_CALL_TO_ACTION,
} from "./texts"
import {
  propositionJustificationsPage_propositionEditor_editorId,
  propositionJustificationsPage_newJustificationDialog_newJustificationEditor_editorId
} from "./editorIds"
import {EditorTypes} from "./reducers/editors"
import {suggestionKeys} from "./autocompleter"
import {selectIsWindowNarrow} from "./selectors"

import NewJustificationDialog from './NewJustificationDialog'
import JustificationsTree from './JustificationsTree'

import "./PropositionJustificationsPage.scss"
import PropositionEntityViewer from './PropositionEntityViewer'
import PropositionTagger from './PropositionTagger'
import {
  combineIds,
  combineSuggestionsKeys,
} from './viewModels'
import * as characters from './characters'


const propositionIdFromProps = (props) => props.match.params.propositionId

const trailPropositionIdsFromProps = (props) => {
  const queryParams = queryString.parse(props.location.search)
  const trailPropositionIdsParam = queryParams['proposition-trail']
  return trailPropositionIdsParam ?
    split(trailPropositionIdsParam, ',') :
    []
}

class PropositionJustificationsPage extends Component {
  constructor() {
    super()
    this.state = {
      isOverProposition: false,
    }

    this.propositionEditorId = propositionJustificationsPage_propositionEditor_editorId
    this.newJustificationEditorId = propositionJustificationsPage_newJustificationDialog_newJustificationEditor_editorId
  }

  componentWillMount() {
    const propositionId = this.propositionId()
    this.props.api.fetchPropositionJustifications(propositionId)

    const trailPropositionIds = trailPropositionIdsFromProps(this.props)
    if (!isEmpty(trailPropositionIds)) {
      this.props.api.fetchPropositions(trailPropositionIds)
    }
  }

  componentWillReceiveProps(nextProps) {
    const propositionId = propositionIdFromProps(this.props)
    const nextPropositionId = propositionIdFromProps(nextProps)

    if (propositionId !== nextPropositionId) {
      this.props.api.fetchPropositionJustifications(nextPropositionId)
    }

    const trailPropositionIds = trailPropositionIdsFromProps(this.props)
    const nextTrailPropositionIds = trailPropositionIdsFromProps(nextProps)
    if (!isEqual(trailPropositionIds, nextTrailPropositionIds) && !isEmpty(nextTrailPropositionIds)) {
      this.props.api.fetchPropositions(nextTrailPropositionIds)
    }
  }

  propositionId = () => propositionIdFromProps(this.props)

  onPropositionMouseOver = () => {
    this.setState({isOverProposition: true})
  }

  onPropositionMouseLeave = () => {
    this.setState({isOverProposition: false})
  }

  editProposition = () => {
    this.props.editors.beginEdit(EditorTypes.PROPOSITION, this.propositionEditorId, this.props.proposition)
  }

  createJustificationPath = () => {
    return paths.createJustification(JustificationBasisSourceType.PROPOSITION, this.propositionId())
  }

  seeUsagesPath = () => {
    return paths.searchJustifications({propositionId: this.propositionId()})
  }

  deleteProposition = () => {
    this.props.api.deleteProposition(this.props.proposition)
  }

  showNewJustificationDialog = (event, polarity = null) => {
    const newJustification = makeNewTrunkJustification(JustificationRootTargetType.PROPOSITION, this.propositionId(),
      polarity)
    this.props.editors.beginEdit(EditorTypes.NEW_JUSTIFICATION, this.newJustificationEditorId, newJustification)

    this.props.ui.showNewJustificationDialog(this.propositionId())
  }

  showNewPositiveJustificationDialog = (event) => {
    this.showNewJustificationDialog(event, JustificationPolarity.POSITIVE)
  }

  showNewNegativeJustificationDialog = (event) => {
    this.showNewJustificationDialog(event, JustificationPolarity.NEGATIVE)
  }

  saveNewJustification = (event) => {
    event.preventDefault()
    this.props.flows.commitEditThenPutActionOnSuccess(EditorTypes.NEW_JUSTIFICATION, this.newJustificationEditorId, ui.hideNewJustificationDialog())
  }

  cancelNewJustificationDialog = () => {
    this.props.ui.hideNewJustificationDialog()
  }

  render () {
    const {
      propositionId,
      proposition,
      trailPropositions,
      justifications,

      isFetchingProposition,
      didFetchingPropositionFail,

      isNewJustificationDialogVisible,
      isWindowNarrow,
    } = this.props
    const {
      isOverProposition,
    } = this.state

    const doHideControls = !isOverProposition && !isWindowNarrow

    const hasJustifications = !isEmpty(justifications)
    const hasAgreement = some(justifications, j => isVerified(j) && isPositive(j))
    const hasDisagreement = some(justifications, j => isVerified(j) && isNegative(j))

    const newTrailPropositions = concat(trailPropositions, [proposition])

    const menu = (
      <MenuButton
        icon
        id={`proposition-${propositionId}-context-menu`}
        className={cn({hidden: doHideControls})}
        menuClassName="context-menu context-menu--proposition"
        children={'more_vert'}
        position={MenuButton.Positions.TOP_RIGHT}
        menuItems={[
          <ListItem primaryText="Add justification"
                    key="addJustification"
                    leftIcon={<FontIcon>add</FontIcon>}
                    onClick={this.showNewJustificationDialog}
          />,
          <ListItem primaryText="Use"
                    key="use"
                    title="Justify another proposition with this one"
                    leftIcon={<FontIcon>call_made</FontIcon>}
                    component={Link}
                    to={this.createJustificationPath()}
          />,
          <ListItem primaryText="See usages"
                    key="usages"
                    title="See justifications using this proposition"
                    leftIcon={<FontIcon>call_merge</FontIcon>}
                    component={Link}
                    to={this.seeUsagesPath()}
          />,
          <Divider key="divider" />,
          <ListItem primaryText="Edit"
                    key="edit"
                    leftIcon={<FontIcon>create</FontIcon>}
                    onClick={this.editProposition}
          />,
          <ListItem primaryText="Delete"
                    key="delete"
                    leftIcon={<FontIcon>delete</FontIcon>}
                    onClick={this.deleteProposition}
          />,
        ]}
      />
    )

    return (
      <div id="proposition-justifications">
        <Helmet>
          <title>{proposition ? proposition.text : 'Loading proposition'} — Howdju</title>
        </Helmet>

        <div className="md-grid md-grid--top">
          {trailPropositions.length > 0 && every(trailPropositions) && (
            <ul className="md-cell md-cell--12 proposition-trail">
              {map(trailPropositions, (trailProposition, index) => (
                <li key={index}>
                  <Link to={paths.proposition(trailProposition, take(trailPropositions, index))}>
                    {trailProposition.text}
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <div className="md-cell md-cell--12">

            <div className="proposition">

              <Card
                className={cn('proposition-card', {
                  agreement: hasAgreement,
                  disagreement: hasDisagreement,
                })}
                onMouseOver={this.onPropositionMouseOver}
                onMouseLeave={this.onPropositionMouseLeave}
              >
                <CardText className="proposition-card-contents">
                  <PropositionEntityViewer
                    id={`editableProposition-${propositionId}`}
                    className="agreeable-proposition-viewer"
                    proposition={proposition}
                    editorId={this.propositionEditorId}
                    suggestionsKey={suggestionKeys.propositionJustificationsPage_propositionEditor}
                    doShowControls={true}
                    menu={menu}
                    trailPropositions={trailPropositions}
                    showJustificationCount={false}
                  />
                  {proposition && (
                    <PropositionTagger
                      propositionId={proposition.id}
                      tags={proposition.tags}
                      votes={proposition.propositionTagVotes}
                      recommendedTags={proposition.recommendedTags}
                      id={combineIds(PropositionJustificationsPage.id, 'proposition-tagger')}
                      suggestionsKey={combineSuggestionsKeys(PropositionJustificationsPage.suggestionsKey, 'tagName')}
                    />
                  )}
                </CardText>
              </Card>

            </div>

          </div>

          {!hasJustifications && !isFetchingProposition && !didFetchingPropositionFail && [
            <div className="md-cell md-cell--12 cell--centered-contents"
                 key="justification-propositions-page-no-justifications-message"
            >
              <div>No justifications.</div>
            </div>,
            <div className="md-cell md-cell--12 cell--centered-contents"
                 key="justification-propositions-page-no-justifications-add-justification-button"
            >
              <Button flat
                      children={t(ADD_JUSTIFICATION_CALL_TO_ACTION)}
                      onClick={this.showNewJustificationDialog}
              />
            </div>
          ]}
        </div>

        {isFetchingProposition && (
          <div className="md-grid md-grid--bottom">
            <div className="md-cell md-cell--12 cell--centered-contents">
              <CircularProgress key="progress" id="propositionJustificationsProgress" />
            </div>
          </div>
        )}

        <JustificationsTree
          justifications={justifications}
          doShowControls={true}
          doShowJustifications={false}
          isUnCondensed={true}
          showNewPositiveJustificationDialog={this.showNewPositiveJustificationDialog}
          showNewNegativeJustificationDialog={this.showNewNegativeJustificationDialog}
          trailPropositions={newTrailPropositions}
          className="md-grid--bottom"
        />

        <NewJustificationDialog
          id="add-new-justification-dialog-editor"
          editorId={this.newJustificationEditorId}
          suggestionsKey={suggestionKeys.propositionJustificationsPage_newJustificationDialog_newJustificationEditor_suggestions}
          visible={isNewJustificationDialogVisible}
          onCancel={this.cancelNewJustificationDialog}
          onSubmit={this.saveNewJustification}
          onHide={this.cancelNewJustificationDialog}
        />

      </div>
    )
  }
}
PropositionJustificationsPage.id = 'PropositionJustificationsPage'
PropositionJustificationsPage.suggestionsKey = 'PropositionJustificationsPage'
PropositionJustificationsPage.transientId = 'proposition-justifications-page-proposition'

const sortJustifications = justifications => {
  justifications = sortBy(justifications, j => j.score)
  justifications = sortBy(justifications, j => isDisverified(j) ? 1 : isVerified(j) ? -1 : 0)
  forEach(justifications, j => {
    j.counterJustifications = sortJustifications(j.counterJustifications)
  })
  return justifications
}

const mapStateToProps = (state, ownProps) => {
  const propositionId = ownProps.match.params.propositionId
  if (!propositionId) {
    logger.error('Missing required propositionId')
    return {}
  }
  const proposition = denormalize(propositionId, propositionSchema, state.entities)
  const trailPropositions = map(trailPropositionIdsFromProps(ownProps), propositionId =>
    // If the proposition has loaded, return that.  Otherwise return a loading proposition with the correct ID.
    state.entities.propositions[propositionId] || makeNewProposition({id: propositionId, text: characters.ellipsis}))

  const propositionEditorState = get(state, ['editors', EditorTypes.PROPOSITION, propositionJustificationsPage_propositionEditor_editorId])

  const isFetchingProposition = get(propositionEditorState, 'isFetching')
  const didFetchingPropositionFail = get(propositionEditorState, ['errors', 'hasErrors'], false)

  let justifications = denormalize(state.entities.trunkJustificationsByRootPropositionId[propositionId], justificationsSchema, state.entities)
  justifications = sortJustifications(justifications)

  const isWindowNarrow = selectIsWindowNarrow(state)

  return {
    ...state.ui.propositionJustificationsPage,
    propositionId,
    proposition,
    trailPropositions,
    justifications,
    isFetchingProposition,
    didFetchingPropositionFail,
    isWindowNarrow,
  }
}

export default connect(mapStateToProps, mapActionCreatorGroupToDispatchToProps({
  api,
  ui,
  editors,
  goto,
  flows,
}))(PropositionJustificationsPage)
