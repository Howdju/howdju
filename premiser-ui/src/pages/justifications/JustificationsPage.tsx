import React, {Component, UIEvent} from "react"
import {
  Button,
  CircularProgress,
  FontIcon,
  ListItem,
} from "react-md"
import {connect, ConnectedProps} from "react-redux"
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
import { isArray } from "lodash"
import { RouteComponentProps } from "react-router"


import {
  EntityId,
  JustificationPolarities,
  JustificationRootPolarity,
  JustificationRootTarget,
  JustificationRootTargetType,
  JustificationTargetTypes,
} from "howdju-common"
import {
  actions,
  isVerified,
  isDisverified,
  makeJustificationEditModelTargetingRoot,
  JustificationViewModel,
} from 'howdju-client-common'

import Helmet from '@/Helmet'
import {
  api,
  apiLike,
  editors,
  mapActionCreatorGroupToDispatchToProps,
  ui,
  goto,
  flows,
} from "@/actions"
import justificationsPage from '@/pages/justifications/justificationsPageSlice'
import * as characters from '@/characters'
import ContextTrail from '@/ContextTrail'
import JustificationsTree from '@/JustificationsTree'
import {logger} from "@/logger"
import CreateJustificationDialog from '@/CreateJustificationDialog'
import {EditorTypes} from "@/reducers/editors"
import JustificationRootTargetCard from '@/JustificationRootTargetCard'
import t, {
  ADD_JUSTIFICATION_CALL_TO_ACTION,
} from "@/texts"
import {
  combineIds,
  combineSuggestionsKeys,
  ContextTrailShortcut,
  contextTrailTypeByShortcut,
  describeRootTarget,
  rootTargetNormalizationSchemasByType,
} from '@/viewModels'
import {makeExtensionHighlightOnClickWritQuoteUrlCallback} from "@/extensionCallbacks"
import { RootState } from "@/store"
import { ComponentId, ContextTrailItemInfo, SuggestionsKey } from "@/types"

import "./JustificationsPage.scss"

/*
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

interface MatchParams {
  rootTargetId: EntityId;
}
interface OwnProps extends RouteComponentProps<MatchParams> {
  rootTargetType: JustificationRootTargetType,
}

interface Props extends OwnProps, PropsFromRedux {}

class JustificationsPage extends Component<Props> {
  static id = justificationsPageId
  static suggestionsKey = justificationsPageId
  static transientId = 'proposition-justifications-page-proposition'
  static rootTargetEditorId = combineIds(justificationsPageId, 'root-target-editor')
  static justificationEditorId = combineIds(justificationsPageId, 'justification-editor')

  componentDidMount() {
    const {rootTargetType, rootTargetId} = this.rootTargetInfo()
    this.props.api.fetchRootJustificationTarget(rootTargetType, rootTargetId)

    const contextTrailItems = contextTrailItemInfosFromProps(this.props)
    if (!isEmpty(contextTrailItems)) {
      this.props.apiLike.fetchJustificationTargets(filterContextTrailItems(contextTrailItems))
    }
  }

  componentDidUpdate(prevProps: Props) {
    const prevRootTargetInfo = rootTargetInfoFromProps(prevProps)
    const rootTargetInfo = this.rootTargetInfo()
    if (!isEqual(rootTargetInfo, prevRootTargetInfo)) {
      this.props.api.fetchRootJustificationTarget(rootTargetInfo)
    }

    const prevContextTrailInfos = contextTrailItemInfosFromProps(prevProps)
    const contextTrailInfos = contextTrailItemInfosFromProps(this.props)
    if (!isEqual(contextTrailInfos, prevContextTrailInfos) && !isEmpty(contextTrailInfos)) {
      this.props.apiLike.fetchJustificationTargets(filterContextTrailItems(contextTrailInfos))
    }
  }

  id = (...args: ComponentId[]) => combineIds(JustificationsPage.id, ...args)

  suggestionsKey = (...args: SuggestionsKey[]) => combineSuggestionsKeys(JustificationsPage.suggestionsKey, ...args)

  rootTargetInfo = () => rootTargetInfoFromProps(this.props)

  showNewJustificationDialog = (_event: UIEvent, polarity?: JustificationRootPolarity) => {
    const {
      rootTargetType,
      rootTargetId,
    } = this.rootTargetInfo()
    const justification = makeJustificationEditModelTargetingRoot(rootTargetType, rootTargetId, polarity)
    this.props.editors.beginEdit(EditorTypes.NEW_JUSTIFICATION, JustificationsPage.justificationEditorId, justification)

    this.props.justificationsPage.showNewJustificationDialog()
  }

  showNewPositiveJustificationDialog = (event: UIEvent) => {
    this.showNewJustificationDialog(event, JustificationPolarities.POSITIVE)
  }

  showNewNegativeJustificationDialog = (event: UIEvent) => {
    this.showNewJustificationDialog(event, JustificationPolarities.NEGATIVE)
  }

  saveNewJustification = (event: Event) => {
    event.preventDefault()
    this.props.flows.commitEditThenPutActionOnSuccess(EditorTypes.NEW_JUSTIFICATION,
      JustificationsPage.justificationEditorId, justificationsPage.hideNewJustificationDialog())
  }

  cancelNewJustificationDialog = () => {
    this.props.justificationsPage.hideNewJustificationDialog()
  }

  render () {
    const {
      rootTargetType,
      rootTarget,
      contextTrailItems,
      sortedJustifications,
      isNewJustificationDialogVisible,
      isFetching,
      dispatch,
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


    const onClickWritQuoteUrl = makeExtensionHighlightOnClickWritQuoteUrlCallback(dispatch)

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
          onClickWritQuoteUrl={onClickWritQuoteUrl}
          className="md-grid--bottom"
        />

        <CreateJustificationDialog
          id={this.id('new-justification-dialog')}
          editorId={JustificationsPage.justificationEditorId}
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

function describeRootTargetType(rootTargetType: JustificationRootTargetType) {
  return toLower(rootTargetType)
}

const sortJustifications = (justifications: JustificationViewModel[]) => {
  justifications = sortBy(justifications, j => j.score)
  justifications = sortBy(justifications, j => isDisverified(j) ? 1 : isVerified(j) ? -1 : 0)
  forEach(justifications, j => {
    j.counterJustifications = sortJustifications(j.counterJustifications)
  })
  return justifications
}

const entitiesStoreKeyByJustificationTargetType = {
  [JustificationTargetTypes.PROPOSITION]: 'propositions',
  [JustificationTargetTypes.STATEMENT]: 'statements',
  [JustificationTargetTypes.JUSTIFICATION]: 'justifications',
} as const

const mapState = (state: RootState, ownProps: OwnProps) => {
  const {
    rootTargetType,
    rootTargetId,
  } = rootTargetInfoFromProps(ownProps)

  if (!rootTargetType || !rootTargetId) {
    logger.error(`rootTargetType and rootTargetId are required`)
  }

  const schema = rootTargetNormalizationSchemasByType[rootTargetType]
  const rootTarget = denormalize(rootTargetId, schema, state.entities)

  const contextTrailItems = map(contextTrailItemInfosFromProps(ownProps), info => toContextTrailItem(state, info))

  const sortedJustifications = rootTarget ? sortJustifications(rootTarget.justifications) : []

  return {
    ...state.justificationsPage,
    rootTargetType,
    rootTarget,
    contextTrailItems,
    sortedJustifications,
  }
}

const rootTargetInfoFromProps = (props: OwnProps) => ({
  rootTargetType: props.rootTargetType,
  rootTargetId: props.match.params.rootTargetId,
})

const contextTrailItemInfosFromProps = (props: OwnProps) => {
  const queryParams = queryString.parse(props.location.search)
  let contextTrailParam = queryParams['context-trail']
  if (isArray(contextTrailParam)) {
    logger.error(`contextTrailParam can only appear once, but appeared multiple times: ${contextTrailParam}. Using first item.`)
    contextTrailParam = contextTrailParam[0]
  }
  return contextTrailParam ? toContextTrailItemInfos(contextTrailParam) : []
}

// It there was an error parsing a context item, we replace it with a null placeholder
type NullContextTrailItemInfo = {[key in keyof ContextTrailItemInfo]: null}
type MaybeContextTrailItemInfo = (ContextTrailItemInfo | NullContextTrailItemInfo)

function toContextTrailItemInfos(contextTrailParam: string): MaybeContextTrailItemInfo[] {
  const infoStrings = split(contextTrailParam, ';')
  const itemInfos = map(infoStrings, (s) => {
    const [typeShortcut, targetId] = split(s, ',')
    if (!(typeShortcut in contextTrailTypeByShortcut)) {
      logger.error(`Invalid context trail type shortcut: ${typeShortcut}`)
      return {
        targetType: null,
        targetId: null,
      }
    }
    return {
      // casting is necessary because `k in o` does not narrow `k`
      // (see https://github.com/microsoft/TypeScript/issues/43284)
      targetType: contextTrailTypeByShortcut[typeShortcut as ContextTrailShortcut],
      targetId,
    }
  })
  return itemInfos
}

function isPresentContextTrailItemInfo(itemInfo: MaybeContextTrailItemInfo): itemInfo is ContextTrailItemInfo {
  return !!itemInfo.targetId
}

function filterContextTrailItems(contextTailsItems: MaybeContextTrailItemInfo[]): ContextTrailItemInfo[] {
  return contextTailsItems.filter(isPresentContextTrailItemInfo)
}

const connector = connect(mapState, mapActionCreatorGroupToDispatchToProps({
  api,
  apiLike,
  ui,
  editors,
  goto,
  flows,
  justificationsPage,
  extension: actions.extension,
}))

type PropsFromRedux = ConnectedProps<typeof connector>

function toContextTrailItem(state: RootState, item: MaybeContextTrailItemInfo) {
  const {
    targetType,
    targetId,
  } = item
  if (targetType === null) {
    return {
      targetType,
      target: null,
    }
  }
  const storeKey = entitiesStoreKeyByJustificationTargetType[targetType]
  // TODO(1): remove typecast
  const target: JustificationRootTarget | undefined = (state.entities[storeKey] as any)?.[targetId]
  return {
    targetType,
    target,
  }
}

export default connector(JustificationsPage)
