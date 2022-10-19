import React from 'react'
import cn from 'classnames'
import concat from 'lodash/concat'
import get from 'lodash/get'
import some from 'lodash/some'
import {
  Card,
  CardText,
  DropdownMenu,
  FontIcon,
  ListItem,
  MenuButton,
} from 'react-md'

import {
  EntityId,
  isNegative,
  isPositive,
  JustificationBasisSourceTypes,
  JustificationRootTarget,
  JustificationRootTargetType,
  JustificationRootTargetTypes,
  logger,
  Persisted,
} from 'howdju-common'

import hoverAware from './hoverAware'
import JustificationRootTargetViewer from './JustificationRootTargetViewer'
import PropositionTagger from './PropositionTagger'
import {EditorTypes} from './reducers/editors'
import paths from './paths'
import Tagger from './Tagger'
import {
  combineIds,
  combineSuggestionsKeys,
} from './viewModels'
import {Link} from 'react-router-dom'
import {connect, ConnectedProps} from 'react-redux'
import {
  api,
  apiLike,
  editors,
  mapActionCreatorGroupToDispatchToProps,
  ui,
} from './actions'

import './JustificationRootTargetCard.scss'
import {divideMenuItems} from "./util"
import { contentReportEditorId } from "./content-report/ReportContentDialog"
import { isVerified, JustificationRootTargetViewModel, makeContentReportFormInputModel } from 'howdju-client-common'
import { ComponentId, ContextTrailItem, EditorId, MenuItems, SuggestionsKey } from './types'

const editorTypesByRootTargetType = {
  [JustificationRootTargetTypes.PROPOSITION]: EditorTypes.PROPOSITION,
}

interface OwnProps {
  id: ComponentId,
  editorId: EditorId,
  suggestionsKey: SuggestionsKey,
  rootTargetType: JustificationRootTargetType,
  rootTarget: JustificationRootTargetViewModel,
  contextTrailItems: ContextTrailItem[],
  extraMenuItems: MenuItems,
  canHover: boolean,
}

interface Props extends OwnProps, PropsFromRedux {}

class JustificationRootTargetCard extends React.Component<Props> {
  state = {
    isOver: false
  }

  render() {
    const {
      id,
      editorId,
      suggestionsKey,
      rootTargetType,
      rootTarget,
      contextTrailItems,
      extraMenuItems,
      canHover,
    } = this.props
    const {
      isOver,
    } = this.state

    const hasAgreement = rootTarget && some(rootTarget.justifications, j => isVerified(j) && isPositive(j))
    const hasDisagreement = rootTarget && some(rootTarget.justifications, j => isVerified(j) && isNegative(j))

    const doHideControls = !isOver && canHover

    const baseEditMenuItems = [
      <ListItem
        primaryText="Delete"
        key="delete"
        leftIcon={<FontIcon>delete</FontIcon>}
        onClick={this.deleteRootTarget}
      />
    ]
    const {
      entity: typeEntityMenuItems,
      edit: typeEditMenuItems
    } = this.menuItemsForType(rootTargetType, rootTarget)

    const entityMenuItems = concat(extraMenuItems, typeEntityMenuItems)
    const editMenuItems = concat(typeEditMenuItems, baseEditMenuItems)
    const reportMenuItems = [
      <ListItem
        primaryText="Report"
        key="report"
        leftIcon={<FontIcon>flag</FontIcon>}
        onClick={this.showReportContentDialog}
      />,
    ]

    const menuItems = divideMenuItems(entityMenuItems, editMenuItems, reportMenuItems)

    // TODO(17): pass props directly after upgrading react-md to a version with correct types
    const menuClassNameProps = {menuClassName: "context-menu context-menu--proposition"} as any
    const menu = (
      <MenuButton
        icon
        id={combineIds(id, 'menu')}
        className={cn({hidden: doHideControls})}
        {...menuClassNameProps}
        children={'more_vert'}
        position={DropdownMenu.Positions.TOP_RIGHT}
        menuItems={menuItems}
      />
    )

    return (
      <div className="root-target-background">

        <Card
          className={cn('root-target-card', {
            agreement: hasAgreement,
            disagreement: hasDisagreement,
          })}
          onMouseOver={this.onMouseOver}
          onMouseLeave={this.onMouseLeave}
        >
          <CardText className="root-target-card-contents">
            <JustificationRootTargetViewer
              id={combineIds(id, 'proposition-entity-viewer')}
              rootTargetType={rootTargetType}
              rootTarget={rootTarget}
              editorId={editorId}
              suggestionsKey={combineSuggestionsKeys(suggestionsKey, 'proposition')}
              menu={menu}
              contextTrailItems={contextTrailItems}
              showJustificationCount={false}
            />
            {rootTarget && rootTargetType !== JustificationRootTargetTypes.PROPOSITION && (
              <Tagger
                targetType={rootTargetType}
                target={rootTarget}
                id={combineIds(id, 'tagger')}
                suggestionsKey={combineSuggestionsKeys(suggestionsKey, 'tagger')}
              />
            )}
            {rootTarget && rootTargetType === JustificationRootTargetTypes.PROPOSITION && (
              <PropositionTagger
                propositionId={rootTarget.id}
                tags={rootTarget.tags}
                votes={rootTarget.propositionTagVotes}
                recommendedTags={rootTarget.recommendedTags}
                id={combineIds(id, 'proposition-tagger')}
                suggestionsKey={combineSuggestionsKeys(suggestionsKey, 'proposition-tagger')}
              />
            )}
          </CardText>
        </Card>

      </div>
    )
  }

  showReportContentDialog = () => {
    const {
      rootTargetType: entityType,
      rootTarget: {
        id: entityId
      },
    } = this.props
    const url = window.location.href
    // TODO: replace this with this.props.flows.startContentReport({entityType, entityId, url}) that
    // encapsulates the showing of the dialog, the starting of the edit, and the creation of the
    // form input model
    this.props.editors.beginEdit("CONTENT_REPORT", contentReportEditorId,
      makeContentReportFormInputModel({entityType, entityId, url}))
  }

  menuItemsForType(rootTargetType: JustificationRootTargetType, rootTarget: Persisted<JustificationRootTarget>) {
    switch (rootTargetType) {
      case JustificationRootTargetTypes.PROPOSITION: {
        const propositionId = get(rootTarget, 'id')
        return {
          entity: [
            <ListItem
              primaryText="Use"
              key="use"
              title="Justify another proposition with this one"
              leftIcon={<FontIcon>call_made</FontIcon>}
              component={Link}
              to={this.createJustificationPath(propositionId)}
            />,
            <ListItem
              primaryText="See usages"
              key="usages"
              title={`See usages of this proposition`}
              leftIcon={<FontIcon>call_merge</FontIcon>}
              component={Link}
              to={paths.propositionUsages(propositionId)}
            />,
          ],
          edit: [
            <ListItem
              primaryText="Edit"
              key="edit"
              leftIcon={<FontIcon>edit</FontIcon>}
              onClick={this.editRootTarget}
            />,
          ],
        }
      }
      // case JustificationRootTargetTypes.STATEMENT: {
      //   // Statements are not directly editable currently.  One must edit their persorgs/propositions
      //   const statementId = get(rootTarget, 'id')
      //   insertAt(divider, 0,
      //     <ListItem
      //       primaryText="See usages"
      //       key="usages"
      //       title={`See usages of this statement`}
      //       leftIcon={<FontIcon>call_merge</FontIcon>}
      //       component={Link}
      //       to={paths.statementUsages(statementId)}
      //     />
      //   )
      //   break
      // }
      default:
        return {entity: [], edit: []}
    }
  }

  createJustificationPath = (propositionId: EntityId) => {
    return paths.createJustification(JustificationBasisSourceTypes.PROPOSITION, propositionId)
  }

  editRootTarget = () => {
    const {
      rootTargetType,
      editorId,
      rootTarget,
    } = this.props
    if (rootTargetType !== "PROPOSITION") {
      logger.error(`Editing a ${rootTargetType} is not supported`)
      return
    }
    const editorType = editorTypesByRootTargetType[rootTargetType]
    this.props.editors.beginEdit(editorType, editorId, rootTarget)
  }

  deleteRootTarget = () => {
    this.props.apiLike.deleteJustificationRootTarget(this.props.rootTargetType, this.props.rootTarget)
  }

  onMouseOver = () => {
    this.setState({isOver: true})
  }

  onMouseLeave = () => {
    this.setState({isOver: false})
  }
}

const connector = connect(null, mapActionCreatorGroupToDispatchToProps({
  api,
  apiLike,
  editors,
  ui,
}))

type PropsFromRedux = ConnectedProps<typeof connector>

export default connector(hoverAware(JustificationRootTargetCard))
