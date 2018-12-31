import React, {Component} from "react"
import Helmet from "react-helmet"
import {
  Button,
  CircularProgress,
  FontIcon,
  ListItem,
} from "react-md"
import {connect} from "react-redux"
import concat from 'lodash/concat'
import forEach from 'lodash/forEach'
import isEmpty from 'lodash/isEmpty'
import isEqual from 'lodash/isEqual'
import map from 'lodash/map'
import sortBy from "lodash/sortBy"
import split from 'lodash/split'
import toLower from 'lodash/toLower'
import {denormalize} from "normalizr"
import queryString from 'query-string'

import {
  isVerified,
  isDisverified,
  JustificationPolarity,
  JustificationTargetType,
  makeNewTrunkJustification,
} from "howdju-common"
import {actions} from 'howdju-client-common'

import {
  api,
  apiLike,
  editors,
  mapActionCreatorGroupToDispatchToProps,
  ui,
  goto,
  flows,
} from "./actions"
import * as characters from './characters'
import ContextTrail from './ContextTrail'
import JustificationsTree from './JustificationsTree'
import {logger} from "./logger"
import NewJustificationDialog from './NewJustificationDialog'
import {EditorTypes} from "./reducers/editors"
import JustificationRootTargetCard from './JustificationRootTargetCard'
import t, {
  ADD_JUSTIFICATION_CALL_TO_ACTION,
} from "./texts"
import {
  combineIds,
  combineSuggestionsKeys,
  contextTrailTypeByShortcut,
  describeRootTarget,
  rootTargetNormalizationSchemasByType,
} from './viewModels'

import "./JustificationsPage.scss"


const rootTargetInfoFromProps = (props) => ({
  rootTargetType: props.rootTargetType,
  rootTargetId: props.match.params.rootTargetId,
})

function toContextTrailInfos(contextTrailParam) {
  const contextTrailItemStrings = split(contextTrailParam, ';')
  const contextTrailItems = map(contextTrailItemStrings, (s) => {
    const [typeShortcut, targetId] = split(s, ',')
    return {
      targetType: contextTrailTypeByShortcut[typeShortcut],
      targetId,
    }
  })
  return contextTrailItems
}

const contextTrailInfosFromProps = (props) => {
  const queryParams = queryString.parse(props.location.search)
  const contextTrailParam = queryParams['context-trail']
  return contextTrailParam ? toContextTrailInfos(contextTrailParam) : []
}

/*
 * contextItems/rootTrail/trailRootItems/contextTrail
 * isVerified => isApproved
 *
 * Next steps:
 *
 * implement drill-down
 * types of context items: StatementProposition, Justification, Anchored Statement/Proposition, Justification, Counters
 * StatementTagging
 *
 * counters moving to center when they are expanded
 */

const justificationsPageId = 'justifications-page'

class JustificationsPage extends Component {
  static id = justificationsPageId
  static suggestionsKey = justificationsPageId
  static transientId = 'proposition-justifications-page-proposition'
  static rootTargetEditorId = combineIds(justificationsPageId, 'root-target-editor')
  static newJustificationEditorId = combineIds(justificationsPageId, 'new-justification-editor')

  componentDidMount() {
    const {rootTargetType, rootTargetId} = this.rootTargetInfo()
    this.props.api.fetchRootJustificationTarget(rootTargetType, rootTargetId)

    const contextTrailItems = contextTrailInfosFromProps(this.props)
    if (!isEmpty(contextTrailItems)) {
      this.props.apiLike.fetchJustificationTargets(contextTrailItems)
    }
  }

  componentDidUpdate(prevProps,) {
    const prevRootTargetInfo = rootTargetInfoFromProps(prevProps)
    const rootTargetInfo = this.rootTargetInfo()
    if (!isEqual(rootTargetInfo, prevRootTargetInfo)) {
      this.props.api.fetchRootJustificationTarget(rootTargetInfo.rootTargetType, rootTargetInfo.rootTargetId)
    }

    const prevContextTrailInfos = contextTrailInfosFromProps(prevProps)
    const contextTrailInfos = contextTrailInfosFromProps(this.props)
    if (!isEqual(contextTrailInfos, prevContextTrailInfos) && !isEmpty(contextTrailInfos)) {
      this.props.apiLike.fetchJustificationTargets(contextTrailInfos)
    }
  }

  id = (...args) => combineIds(JustificationsPage.id, ...args)

  suggestionsKey = (...args) => combineSuggestionsKeys(JustificationsPage.suggestionsKey, ...args)

  rootTargetInfo = () => rootTargetInfoFromProps(this.props)

  showNewJustificationDialog = (event, polarity = null) => {
    const {
      rootTargetType,
      rootTargetId,
    } = this.rootTargetInfo()
    const newJustification = makeNewTrunkJustification(rootTargetType, rootTargetId, polarity)
    this.props.editors.beginEdit(EditorTypes.NEW_JUSTIFICATION, JustificationsPage.newJustificationEditorId, newJustification)

    this.props.ui.showNewJustificationDialog()
  }

  showNewPositiveJustificationDialog = (event) => {
    this.showNewJustificationDialog(event, JustificationPolarity.POSITIVE)
  }

  showNewNegativeJustificationDialog = (event) => {
    this.showNewJustificationDialog(event, JustificationPolarity.NEGATIVE)
  }

  saveNewJustification = (event) => {
    event.preventDefault()
    this.props.flows.commitEditThenPutActionOnSuccess(EditorTypes.NEW_JUSTIFICATION, JustificationsPage.newJustificationEditorId, ui.hideNewJustificationDialog())
  }

  cancelNewJustificationDialog = () => {
    this.props.ui.hideNewJustificationDialog()
  }

  onClickWritQuoteUrl = (justificationId, visitUrl) => {
    this.props.extension.focusJustificationOnUrl(visitUrl, justificationId, window.location.href)
  }

  render () {
    const {
      rootTargetType,
      rootTarget,
      contextTrailItems,
      sortedJustifications,
      isNewJustificationDialogVisible,
      isFetching,
    } = this.props

    const hasJustifications = !isEmpty(sortedJustifications)

    const nextContextTrailItems = concat(contextTrailItems, [{
      targetType: rootTargetType,
      target: rootTarget,
    }])

    const rootTargetExtraMenuItems = [
      <ListItem
        primaryText="Add justification"
        key="addJustification"
        leftIcon={<FontIcon>add</FontIcon>}
        onClick={this.showNewJustificationDialog}
      />,
    ]

    return (
      <div id="justifications-page">
        <Helmet>
          <title>
            {rootTarget ?
              describeRootTarget(rootTargetType, rootTarget) :
              `Loading ${describeRootTargetType(rootTargetType)}${characters.ellipsis}`} — Howdju
          </title>
        </Helmet>

        <div className="md-grid md-grid--top">
          <ContextTrail trailItems={contextTrailItems} className="md-cell md-cell--12 " />

          <div className="md-cell md-cell--12">

            <JustificationRootTargetCard
              id={this.id('root-target')}
              rootTargetType={rootTargetType}
              rootTarget={rootTarget}
              editorId={JustificationsPage.rootTargetEditorId}
              suggestionsKey={this.suggestionsKey('root-target')}
              contextTrailItems={contextTrailItems}
              showJustificationCount={false}
              onShowNewJustificationDialog={this.showNewJustificationDialog}
              extraMenuItems={rootTargetExtraMenuItems}
            />

          </div>

          {isFetching &&
            <div className="md-grid md-grid--bottom">
              <div className="md-cell md-cell--12 cell--centered-contents">
                <CircularProgress key="progress" id="justifications-page-progress" />
              </div>
            </div>
          }
          {!isFetching && !hasJustifications &&
            <div className="md-cell md-cell--12 cell--centered-contents"
                 key="no-justifications-message"
            >
              <div>No justifications.</div>
            </div>
          }
          {hasJustifications ||
            <div className="md-cell md-cell--12 cell--centered-contents"
                 key="add-justification-button"
            >
              <Button flat
                      children={t(ADD_JUSTIFICATION_CALL_TO_ACTION)}
                      onClick={this.showNewJustificationDialog}
              />
            </div>
          }
        </div>

        <JustificationsTree
          justifications={sortedJustifications}
          doShowControls={true}
          doShowJustifications={false}
          isUnCondensed={true}
          showNewPositiveJustificationDialog={this.showNewPositiveJustificationDialog}
          showNewNegativeJustificationDialog={this.showNewNegativeJustificationDialog}
          contextTrailItems={nextContextTrailItems}
          onClickWritQuoteUrl={this.onClickWritQuoteUrl}
          className="md-grid--bottom"
        />

        <NewJustificationDialog
          id={this.id('new-justification-dialog')}
          editorId={JustificationsPage.newJustificationEditorId}
          suggestionsKey={this.suggestionsKey('new-justification-dialog')}
          visible={isNewJustificationDialogVisible}
          onCancel={this.cancelNewJustificationDialog}
          onSubmit={this.saveNewJustification}
          onHide={this.cancelNewJustificationDialog}
        />

      </div>
    )
  }
}

function describeRootTargetType(rootTargetType) {
  return toLower(rootTargetType)
}

const sortJustifications = justifications => {
  justifications = sortBy(justifications, j => j.score)
  justifications = sortBy(justifications, j => isDisverified(j) ? 1 : isVerified(j) ? -1 : 0)
  forEach(justifications, j => {
    j.counterJustifications = sortJustifications(j.counterJustifications)
  })
  return justifications
}

const entitiesStoreKeyByJustificationTargetType = {
  [JustificationTargetType.PROPOSITION]: 'propositions',
  [JustificationTargetType.STATEMENT]: 'statements',
  [JustificationTargetType.JUSTIFICATION]: 'justifications',
}

function toContextTrailItem(state, info) {
  const {
    targetType,
    targetId,
  } = info
  const storeKey = entitiesStoreKeyByJustificationTargetType[targetType]
  const target = state.entities[storeKey][targetId]
  return {
    targetType,
    target,
  }
}

const mapStateToProps = (state, ownProps) => {
  const {
    rootTargetType,
    rootTargetId,
  } = rootTargetInfoFromProps(ownProps)

  if (!rootTargetType || !rootTargetId) {
    logger.error(`rootTargetType and rootTargetId are required`)
  }

  const schema = rootTargetNormalizationSchemasByType[rootTargetType]
  const rootTarget = denormalize(rootTargetId, schema, state.entities)

  const contextTrailItems = map(contextTrailInfosFromProps(ownProps), info => toContextTrailItem(state, info) || null)

  const sortedJustifications = rootTarget ? sortJustifications(rootTarget.justifications) : []

  return {
    ...state.ui.justificationsPage,
    rootTargetType,
    rootTarget,
    contextTrailItems,
    sortedJustifications,
  }
}

export default connect(mapStateToProps, mapActionCreatorGroupToDispatchToProps({
  api,
  apiLike,
  ui,
  editors,
  goto,
  flows,
  extension: actions.extension,
}))(JustificationsPage)
