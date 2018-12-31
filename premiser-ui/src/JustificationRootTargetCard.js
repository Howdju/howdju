import React from 'react'
import cn from 'classnames'
import concat from 'lodash/concat'
import get from 'lodash/get'
import some from 'lodash/some'
import {
  Card,
  CardText,
  Divider,
  FontIcon,
  ListItem,
  MenuButton,
} from 'react-md'

import {
  insertAt,
  isNegative,
  isPositive,
  isVerified,
  JustificationBasisSourceType,
  JustificationRootTargetType,
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
import connect from 'react-redux/es/connect/connect'
import {
  api,
  editors,
  apiLike,
  mapActionCreatorGroupToDispatchToProps
} from './actions'

import './JustificationRootTargetCard.scss'

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

    const thisMenuItems = [
      <ListItem
        primaryText="Delete"
        key="delete"
        leftIcon={<FontIcon>delete</FontIcon>}
        onClick={this.deleteRootTarget}
      />
    ]
    const divider = extraMenuItems ? [<Divider key="divider" />] : []
    switch (rootTargetType) {
      case JustificationRootTargetType.PROPOSITION: {
        const propositionId = get(rootTarget, 'id')
        insertAt(divider, 0,
          <ListItem
            primaryText="See usages"
            key="usages"
            title={`See usages of this proposition`}
            leftIcon={<FontIcon>call_merge</FontIcon>}
            component={Link}
            to={paths.propositionUsages(propositionId)}
          />
        )
        insertAt(divider, 0,
          <ListItem
            primaryText="Use"
            key="use"
            title="Justify another proposition with this one"
            leftIcon={<FontIcon>call_made</FontIcon>}
            component={Link}
            to={this.createJustificationPath(propositionId)}
          />
        )
        insertAt(thisMenuItems, 0,
          <ListItem
            primaryText="Edit"
            key="edit"
            leftIcon={<FontIcon>edit</FontIcon>}
            onClick={this.editRootTarget}
          />
        )
        break
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
        // nothing
        break
    }

    const menuItems = concat(extraMenuItems, divider, thisMenuItems)

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
  editors,
  apiLike,
}))(hoverAware(JustificationRootTargetCard))