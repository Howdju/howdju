import React from 'react'
import cn from 'classnames'
import concat from 'lodash/concat'
import some from 'lodash/some'
import {Card, CardText, FontIcon, ListItem, MenuButton} from 'react-md'

import {
  isNegative,
  isPositive,
  isVerified,
  JustificationRootTargetType,
} from 'howdju-common'

import hoverAware from './hoverAware'
import JustificationRootTargetViewer from './JustificationRootTargetViewer'
import PropositionTagger from './PropositionTagger'
import {EditorTypes} from './reducers/editors'
import './RootTargetCard.scss'
import Tagger from './Tagger'
import {
  combineEditorIds,
  combineIds,
  combineSuggestionsKeys,
} from './viewModels'

const editorTypesByRootTargetType = {
  [JustificationRootTargetType.PROPOSITION]: EditorTypes.PROPOSITION,
  [JustificationRootTargetType.STATEMENT]: EditorTypes.STATEMENT,
}

class RootTargetCard extends React.Component {
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

    const thisMenuItems = []
    const editMenuItem = (
      <ListItem primaryText="Edit"
                key="edit"
                leftIcon={<FontIcon>create</FontIcon>}
                onClick={this.editRootTarget}
      />
    )
    const deleteMenuItem = (
      <ListItem primaryText="Delete"
                key="delete"
                leftIcon={<FontIcon>delete</FontIcon>}
                onClick={this.deleteRootTarget}
      />
    )
    switch (rootTargetType) {
      case JustificationRootTargetType.PROPOSITION:
        thisMenuItems.push(editMenuItem)
        break
      case JustificationRootTargetType.STATEMENT:
        // Statements are not directly editable currently.  One must edit their persorgs/propositions
        break
      default:
        // nothing
        break
    }
    thisMenuItems.push(deleteMenuItem)
    const menuItems = concat(extraMenuItems, thisMenuItems)

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
              editorId={combineEditorIds(editorId, rootTargetType)}
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

  editRootTarget = () => {
    const editorType = editorTypesByRootTargetType[this.props.rootTargetType]
    this.props.editors.beginEdit(editorType, this.props.editorId, this.props.rootTarget)
  }

  deleteRootTarget = () => {
    this.props.api.deleteRootTarget(this.props.rootTargetType, this.props.rootTarget)
  }

  onMouseOver = () => {
    this.setState({isOver: true})
  }

  onMouseLeave = () => {
    this.setState({isOver: false})
  }
}

export default hoverAware(RootTargetCard)
