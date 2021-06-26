import React from 'react'
import cn from 'classnames'
import concat from 'lodash/concat'
import get from 'lodash/get'
import some from 'lodash/some'
import {
  Card,
  CardText,
  FontIcon,
  ListItem,
  MenuButton,
} from 'react-md'

import {
  isNegative,
  isPositive,
  isVerified,
  JustificationBasisSourceType,
  JustificationRootTargetType,
  makeNewContentReport,
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
import {connect} from 'react-redux'
import {
  api,
  apiLike,
  editors,
  mapActionCreatorGroupToDispatchToProps,
  ui,
} from './actions'

import './JustificationRootTargetCard.scss'
import {divideMenuItems} from "./util"
import ReportContentDialog from "./content-report/ReportContentDialog"

const editorTypesByRootTargetType = {
  [JustificationRootTargetType.PROPOSITION]: EditorTypes.PROPOSITION,
  [JustificationRootTargetType.STATEMENT]: EditorTypes.STATEMENT,
}

class JustificationRootTargetCard extends React.Component {
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
      onFetchedRootTarget,
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

    const menu = (
      <MenuButton
        icon
        id={combineIds(id, 'menu')}
        className={cn({hidden: doHideControls})}
        menuClassName="context-menu context-menu--proposition"
        children={'more_vert'}
        position={MenuButton.Positions.TOP_RIGHT}
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
              onFetchedRootTarget={onFetchedRootTarget}
            />
            {rootTarget && rootTargetType !== JustificationRootTargetType.PROPOSITION && (
              <Tagger
                trargetType={rootTargetType}
                target={rootTarget}
                id={combineIds(id, 'tagger')}
                suggestionsKey={combineSuggestionsKeys(suggestionsKey, 'tagger')}
              />
            )}
            {rootTarget && rootTargetType === JustificationRootTargetType.PROPOSITION && (
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
    this.props.editors.beginEdit(ReportContentDialog.editorType, ReportContentDialog.editorId,
      makeNewContentReport({entityType, entityId, url}))
  }

  menuItemsForType(rootTargetType, rootTarget) {
    switch (rootTargetType) {
      case JustificationRootTargetType.PROPOSITION: {
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
      // case JustificationRootTargetType.STATEMENT: {
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
        return []
    }
  }

  createJustificationPath = (propositionId) => {
    return paths.createJustification(JustificationBasisSourceType.PROPOSITION, propositionId)
  }

  editRootTarget = () => {
    const editorType = editorTypesByRootTargetType[this.props.rootTargetType]
    this.props.editors.beginEdit(editorType, this.props.editorId, this.props.rootTarget)
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

export default connect(null, mapActionCreatorGroupToDispatchToProps({
  api,
  apiLike,
  editors,
  ui,
}))(hoverAware(JustificationRootTargetCard))
