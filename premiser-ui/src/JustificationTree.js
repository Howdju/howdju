import React, {Component} from "react"
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import {connect} from "react-redux"
import cn from "classnames"
import Divider from "react-md/lib/Dividers"
import Card from "react-md/lib/Cards/Card"
import Button from 'react-md/lib/Buttons/Button'
import FontIcon from "react-md/lib/FontIcons"
import MenuButton from "react-md/lib/Menus/MenuButton"
import ListItem from "react-md/lib/Lists/ListItem"
import Positions from "react-md/lib/Menus/Positions"
import FlipMove from 'react-flip-move'
import get from 'lodash/get'
import map from 'lodash/map'

import {
  isVerified,
  isDisverified,
  isStatementCompoundBased,
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
import {
  counterJustificationEditorId,
  justificationBasisEditorId
} from './editorIds'
import paths from './paths'
import config from './config'
import CounterJustificationEditor from "./CounterJustificationEditor"
import EditableJustificationBasis from "./EditableJustificationBasis"
import {EditorTypes} from "./reducers/editors"
import {suggestionKeys} from "./autocompleter"
import ChatBubble from './ChatBubble'
import {selectIsWindowNarrow} from "./selectors"
import t from './texts'

import './JustificationTree.scss'


const justificationTreeId = props => {
  const {
    justification
  } = props
  return `justification-${justification.id}-tree`
}

class JustificationTree extends Component {
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
    this.props.editors.beginEdit(EditorTypes.COUNTER_JUSTIFICATION, counterJustificationEditorId(justification), makeNewCounterJustification(justification))
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
      case JustificationBasisType.STATEMENT_COMPOUND:
        params.statementCompoundId = justificationBasis.entity.id
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
      isEditingBasis,
      doShowControls,
      doShowBasisJustifications,
      isCondensed,
      isUnCondensed,
      isWindowNarrow,
    } = this.props
    const _isVerified = isVerified(justification)
    const _isDisverified = isDisverified(justification)
    const {
      isOver,
      areCounterJustificationsExpanded,
    } = this.state

    const _isStatementCompoundBased = isStatementCompoundBased(justification)
    const _isRootPositive = isRootPositive(justification)
    const _isRootNegative = isRootNegative(justification)

    const doHideControls = !isOver && !isWindowNarrow

    const menu = (
      <MenuButton
        icon
        id={`justification-${justification.id}-context-menu`}
        className={cn({hidden: doHideControls})}
        menuClassName="context-menu"
        buttonChildren={'more_vert'}
        position={Positions.TOP_RIGHT}
        title="Justification actions"
        children={[
          <ListItem primaryText="Counter"
                    key="counter"
                    leftIcon={<FontIcon>reply</FontIcon>}
                    onClick={this.onEditNewCounterJustification}
          />,
          <ListItem primaryText="Use"
                    key="use"
                    title="Justify another statement with this basis"
                    leftIcon={<FontIcon>call_made</FontIcon>}
                    component={Link}
                    to={this.createJustificationPath()}
          />,
          <ListItem primaryText="See usages"
                    key="usages"
                    title="See justifications using this basis"
                    leftIcon={<FontIcon>call_merge</FontIcon>}
                    component={Link}
                    to={this.seeUsagesPath()}
          />,
          <ListItem primaryText="Link"
                    key="link"
                    title="A link to this justification"
                    leftIcon={<FontIcon>link</FontIcon>}
                    component={Link}
                    to={paths.justification(justification)}
          />,
          <Divider key="divider" />,
          <ListItem primaryText="Edit"
                    key="edit"
                    leftIcon={<FontIcon>create</FontIcon>}
                    className={cn({hidden: _isStatementCompoundBased})}
                    onClick={this.onEditBasis}
          />,
          <ListItem primaryText="Delete"
                    key="delete"
                    leftIcon={<FontIcon>delete</FontIcon>}
                    onClick={this.deleteClick}
          />,
        ]}
      />
    )

    const actions = [
      <Button icon
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
      <Button icon
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
      <Button icon
              key="counterButton"
              className={cn({
                hiding: doHideControls,
              })}
              title="Counter this justification"
              onClick={this.onEditNewCounterJustification}
      >reply</Button>
    ]
    const hasCounterJustifications = justification.counterJustifications && justification.counterJustifications.length > 0
    if (hasCounterJustifications) {
      const toggleCounterJustificationsExpandedButtonIcon = areCounterJustificationsExpanded ? 'expand_more' : 'expand_less'
      actions.push(
        <Button icon
                key="toggleCounterJustificationsExpandedButton"
                className={cn({
                  hiding: doHideControls,
                })}
                title={areCounterJustificationsExpanded ? t("Collapse counter-justifications") : t("Expand counter justifications")}
                onClick={this.toggleCounterJustificationsExpanded}
        >{toggleCounterJustificationsExpandedButtonIcon}</Button>
      )
    }

    const {flipMoveDuration, flipMoveEasing} = config.ui
    const counterJustifications = (
      <div className="counter-justifications">
        <FlipMove duration={flipMoveDuration} easing={flipMoveEasing}>
          {newCounterJustification &&
          <Card id="newCounterJustificationCard" key="newCounterJustificationCard" className="justification-card">

            <CounterJustificationEditor editorId={counterJustificationEditorId(justification)}
                                        textId={`justification=${justification.id}-newCounterJustification`}
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
                <ConnectedJustificationTree justification={j}
                                            doShowControls={doShowControls}
                                            doShowBasisJustifications={doShowBasisJustifications}
                                            isCondensed={isCondensed}
                                            isUnCondensed={isUnCondensed}
                />
              </div>
            )
          })}
        </FlipMove>
      </div>
    )

    const treeClasses = cn('justification-tree', {
      positivey: _isRootPositive,
      negativey: _isRootNegative,
    })
    return (
      <div className={treeClasses}
           id={justificationTreeId(this.props)}
      >
        <ChatBubble className="md-grid"
                    isPositive={_isRootPositive}
                    isNegative={_isRootNegative}
                    onMouseOver={this.onBubbleMouseOver}
                    onMouseLeave={this.onBubbleMouseLeave}
        >
          <div className="md-cell md-cell--12">
            {justification && !isEditingBasis && doShowControls && menu}
            <EditableJustificationBasis id={`justification-${justification.id}-basisEditor`}
                                        justification={justification}
                                        editorId={justificationBasisEditorId(justification.basis)}
                                        suggestionsKey={suggestionKeys.justificationBasisEditor(justification)}
                                        doShowControls={doShowControls}
                                        doShowBasisJustifications={doShowBasisJustifications}
                                        isCondensed={isCondensed}
                                        isUnCondensed={isUnCondensed}
            />
          </div>

          {doShowControls && (
            <div className="md-cell md-cell--12 actions">
              {!isEditingBasis && actions}
            </div>
          )}

          {areCounterJustificationsExpanded && counterJustifications}
        </ChatBubble>
      </div>
    )
  }
}
JustificationTree.propTypes = {
  doShowControls: PropTypes.bool
}
JustificationTree.defaultProps = {
  doShowControls: true
}

const mapStateToProps = (state, ownProps) => {
  const justification = ownProps.justification
  const justificationBasis = justification.basis
  const basisEditorType = justificationBasis.type
  const editEntity = get(state, ['editors', basisEditorType, justificationBasisEditorId(justificationBasis), 'editEntity'])
  const isEditingBasis = !!editEntity

  const newCounterJustification = get(state, ['editors', EditorTypes.COUNTER_JUSTIFICATION, counterJustificationEditorId(justification), 'editEntity'])

  const isWindowNarrow = selectIsWindowNarrow(state)
  return {
    newCounterJustification,
    isEditingBasis,
    isWindowNarrow,
  }
}

const ConnectedJustificationTree = connect(mapStateToProps, mapActionCreatorGroupToDispatchToProps({
  api,
  editors,
  goto,
  ui,
}))(JustificationTree)

export default ConnectedJustificationTree