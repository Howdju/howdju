import cn from "classnames"
import get from 'lodash/get'
import map from 'lodash/map'
import moment from 'moment'
import PropTypes from 'prop-types'
import React, {Component} from "react"
import FlipMove from 'react-flip-move'
import { Link } from 'react-router-dom'
import {connect} from "react-redux"
import {
  Divider,
  Card,
  Button,
  FontIcon,
  MenuButton,
  ListItem,
} from "react-md"

import {
  isVerified,
  isDisverified,
  isWritQuoteBased,
  makeNewCounterJustification,
  isRootPositive,
  isRootNegative,
  JustificationBasisType,
  newExhaustedEnumError,
} from 'howdju-common'

import {
  api,
  editors,
  goto,
  mapActionCreatorGroupToDispatchToProps,
  ui,
} from './actions'
import {suggestionKeys} from "./autocompleter"
import config from './config'
import CounterJustificationEditor from "./CounterJustificationEditor"
import {
  counterJustificationEditorId,
  justificationBasisEditorId
} from './editorIds'
import hoverAware from "./hoverAware"
import JustificationChatBubble from './JustificationChatBubble'
import paths from './paths'
import {EditorTypes} from "./reducers/editors"
import t from './texts'

import './JustificationBranch.scss'


const justificationTreeId = props => {
  const {
    justification
  } = props
  return `justification-${justification.id}-tree`
}

class JustificationBranch extends Component {
  constructor() {
    super()
    this.state = {
      isOver: false,
      areCounterJustificationsExpanded: true,
    }
  }

  onBubbleMouseOver = event => {
    this.setState({isOver: true})
  }

  onBubbleMouseLeave = event => {
    this.setState({isOver: false})
  }

  onVerify = () => {
    const {justification} = this.props
    if (isVerified(justification)) {
      this.props.api.unVerifyJustification(justification)
    } else {
      this.props.api.verifyJustification(justification)
    }
  }

  onDisverify = () => {
    const {justification} = this.props
    if (isDisverified(justification)) {
      this.props.api.unDisverifyJustification(justification)
    } else {
      this.props.api.disverifyJustification(justification)
    }
  }

  deleteClick = () => {
    this.props.api.deleteJustification(this.props.justification)
  }

  onEditNewCounterJustification = () => {
    const justification = this.props.justification
    this.props.editors.beginEdit(EditorTypes.COUNTER_JUSTIFICATION, counterJustificationEditorId(justification),
      makeNewCounterJustification(justification))
  }

  onEditBasis = () => {
    const justificationBasis = this.props.justification.basis
    const basisEditorType = justificationBasis.type
    this.props.editors.beginEdit(basisEditorType, justificationBasisEditorId(justificationBasis), justificationBasis.entity)
  }

  createJustificationPath = () => {
    const {
      type: basisType,
      entity: {
        id: basisId
      }
    } = this.props.justification.basis
    return paths.createJustification(basisType, basisId)
  }

  seeUsagesPath = () => {
    const justificationBasis = this.props.justification.basis
    const params = {}

    switch (justificationBasis.type) {
      case JustificationBasisType.WRIT_QUOTE:
        params.writQuoteId = justificationBasis.entity.id
        break
      case JustificationBasisType.PROPOSITION_COMPOUND:
        params.propositionCompoundId = justificationBasis.entity.id
        break
      case JustificationBasisType.JUSTIFICATION_BASIS_COMPOUND:
        params.justificationBasisCompoundId = justificationBasis.entity.id
        break
      default:
        throw newExhaustedEnumError('JustificationBasisType', justificationBasis.type)
    }

    return paths.searchJustifications(params)
  }

  toggleCounterJustificationsExpanded = () => {
    this.setState({
      areCounterJustificationsExpanded: !this.state.areCounterJustificationsExpanded
    })
  }

  render() {
    const {
      justification,
      newCounterJustification,
      doShowControls,
      doShowBasisJustifications,
      isCondensed,
      isUnCondensed,
      canHover,
      showBasisUrls,
      contextTrailItems,
      showStatusText,
      onClickWritQuoteUrl,
    } = this.props
    const _isVerified = isVerified(justification)
    const _isDisverified = isDisverified(justification)
    const {
      isOver,
      areCounterJustificationsExpanded,
    } = this.state

    const _isWritQuoteBased = isWritQuoteBased(justification)
    const _isRootPositive = isRootPositive(justification)
    const _isRootNegative = isRootNegative(justification)

    const doHideControls = !isOver && canHover

    const menu = (
      <MenuButton
        icon
        id={`justification-${justification.id}-context-menu`}
        className={cn({hidden: doHideControls})}
        menuClassName="context-menu justification-context-menu"
        children={'more_vert'}
        position={MenuButton.Positions.TOP_RIGHT}
        title="Justification actions"
        menuItems={[
          <ListItem
            primaryText="Counter"
            key="counter"
            leftIcon={<FontIcon>reply</FontIcon>}
            onClick={this.onEditNewCounterJustification}
          />,
          <ListItem
            primaryText="Use"
            key="use"
            title="Justify another proposition with this basis"
            leftIcon={<FontIcon>call_made</FontIcon>}
            component={Link}
            to={this.createJustificationPath()}
          />,
          <ListItem
            primaryText="See usages"
            key="usages"
            title="See justifications using this basis"
            leftIcon={<FontIcon>call_merge</FontIcon>}
            component={Link}
            to={this.seeUsagesPath()}
          />,
          <ListItem
            primaryText="Link"
            key="link"
            title="A link to this justification"
            leftIcon={<FontIcon>link</FontIcon>}
            component={Link}
            to={paths.justification(justification)}
          />,
          <Divider key="divider" />,
          <ListItem
            primaryText="Edit"
            key="edit"
            leftIcon={<FontIcon>create</FontIcon>}
            className={cn({hidden: !_isWritQuoteBased})}
            onClick={this.onEditBasis}
          />,
          <ListItem
            primaryText="Delete"
            key="delete"
            leftIcon={<FontIcon>delete</FontIcon>}
            onClick={this.deleteClick}
          />,
        ]}
      />
    )

    const age = justification.created ? moment(justification.created).fromNow() : ''
    const created = justification.created ? moment(justification.created).format(config.humanDateTimeFormat) : ''
    const creatorName = get(justification, 'creator.longName')
    const creatorNameDescription = creatorName && ` by ${creatorName}` || ''

    const actions = [
      <Button
        icon
        key="verifyButton"
        className={cn({
          verified: _isVerified,
          inactive: doHideControls,
          hiding: !_isVerified && doHideControls,
          otherSelected: _isDisverified,
        })}
        title="Verify this justification"
        onClick={this.onVerify}
      >thumb_up</Button>,
      <Button
        icon
        key="disverifyButton"
        className={cn({
          disverified: _isDisverified,
          inactive: doHideControls,
          hiding: !_isDisverified && doHideControls,
          otherSelected: _isVerified,
        })}
        title="Dis-verify this justification"
        onClick={this.onDisverify}
      >thumb_down</Button>,
      <Button
        icon
        key="counterButton"
        className={cn({
          hiding: doHideControls,
        })}
        title="Counter this justification"
        onClick={this.onEditNewCounterJustification}
      >reply</Button>,
    ]
    const hasCounterJustifications = justification.counterJustifications && justification.counterJustifications.length > 0
    if (hasCounterJustifications) {
      const toggleCounterJustificationsExpandedButtonIcon = areCounterJustificationsExpanded ? 'expand_more' : 'expand_less'
      actions.push(
        <Button
          icon
          key="toggleCounterJustificationsExpandedButton"
          className={cn({
            hiding: doHideControls,
          })}
          title={areCounterJustificationsExpanded ? t("Collapse counter-justifications") : t("Expand counter justifications")}
          onClick={this.toggleCounterJustificationsExpanded}
        >{toggleCounterJustificationsExpandedButtonIcon}</Button>
      )
    }
    actions.push(
      <div className="justification-status-text" key="justification-status-text">
        <span className="entity-status-text">
          created{creatorNameDescription} <span title={created}>{age}</span>
        </span>
      </div>
    )

    const flipMoveProps = config.ui.flipMove
    const counterJustifications = (
      <div className="counter-justifications">
        <FlipMove {...flipMoveProps}>
          {hasCounterJustifications &&
            <h3 key={`justification-${justification.id}-counter-justifications`}>Counter Justifications</h3>
          }
          {newCounterJustification &&
            <Card id="newCounterJustificationCard" key="newCounterJustificationCard" className="justification-card">

              <CounterJustificationEditor
                editorId={counterJustificationEditorId(justification)}
                id={`justification-${justification.id}-new-counter-justification-editor`}
                suggestionsKey={suggestionKeys.counterJustificationEditor(justification.id)}
              />

            </Card>
          }
          {map(justification.counterJustifications, j => {
            const id = `counter-justification-${j.id}-branch`
            return (
              <div id={id}
                   key={id}
                   className="counter-justification-branch"
              >
                <ConnectedJustificationBranch
                  justification={j}
                  doShowControls={doShowControls}
                  doShowBasisJustifications={doShowBasisJustifications}
                  isCondensed={isCondensed}
                  isUnCondensed={isUnCondensed}
                  contextTrailItems={contextTrailItems}
                />
              </div>
            )
          })}
        </FlipMove>
      </div>
    )

    return (
      <div
        className={cn('justification-tree', {
          positivey: _isRootPositive,
          negativey: _isRootNegative,
        })}
        id={justificationTreeId(this.props)}
      >
        <JustificationChatBubble
          id={`justification-${justification.id}-chat-bubble`}
          className="md-grid"
          justification={justification}
          writQuoteEditorId={justificationBasisEditorId(justification.basis)}
          doShowBasisJustifications={doShowBasisJustifications}
          doShowControls={doShowControls}
          showBasisUrls={showBasisUrls}
          showStatusText={showStatusText}
          menu={menu}
          contextTrailItems={contextTrailItems}
          actions={
            <div className="md-cell md-cell--12 actions">
              {actions}
            </div>
          }
          onMouseOver={this.onBubbleMouseOver}
          onMouseLeave={this.onBubbleMouseLeave}
          onClickWritQuoteUrl={onClickWritQuoteUrl}
        >
          {areCounterJustificationsExpanded && counterJustifications}
        </JustificationChatBubble>
      </div>
    )
  }
}
JustificationBranch.propTypes = {
  doShowControls: PropTypes.bool
}
JustificationBranch.defaultProps = {
  doShowControls: true,
}

const mapStateToProps = (state, ownProps) => {
  const justification = ownProps.justification

  const newCounterJustification = get(state, ['editors', EditorTypes.COUNTER_JUSTIFICATION, counterJustificationEditorId(justification), 'editEntity'])

  return {
    newCounterJustification,
  }
}

const ConnectedJustificationBranch = connect(mapStateToProps, mapActionCreatorGroupToDispatchToProps({
  api,
  editors,
  goto,
  ui,
}))(hoverAware(JustificationBranch))

export default ConnectedJustificationBranch
