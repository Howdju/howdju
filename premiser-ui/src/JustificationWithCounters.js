import cn from "classnames"
import PropTypes from 'prop-types'
import React, {Component} from "react"
import {connect} from "react-redux"
import Divider from "react-md/lib/Dividers"
import Card from "react-md/lib/Cards/Card"
import CardActions from "react-md/lib/Cards/CardActions"
import Button from 'react-md/lib/Buttons/Button'
import FontIcon from "react-md/lib/FontIcons"
import MenuButton from "react-md/lib/Menus/MenuButton"
import ListItem from "react-md/lib/Lists/ListItem"
import Positions from "react-md/lib/Menus/Positions";
import FlipMove from 'react-flip-move'
import get from 'lodash/get'
import map from 'lodash/map'

import {
  api,
  editors, mapActionCreatorGroupToDispatchToProps, goto,
} from './actions'
import {
  isVerified,
  isDisverified, isStatementCompoundBased, hasQuote, makeNewCounterJustification,
} from './models'
import {counterJustificationEditorId, justificationBasisEditorId} from './editorIds'
import paths from './paths'

import config from './config';

import CounterJustificationEditor from "./CounterJustificationEditor";

import EditableJustificationBasis from "./EditableJustificationBasis";
import {EditorTypes} from "./reducers/editors";
import {suggestionKeys} from "./autocompleter";


class JustificationWithCounters extends Component {
  constructor() {
    super()
    this.state = {
      isOver: false,
    }

    this.deleteClick = this.deleteClick.bind(this)

    this.onEditBasis = this.onEditBasis.bind(this)

    this.onCardMouseOver = this.onCardMouseOver.bind(this)
    this.onCardMouseLeave = this.onCardMouseLeave.bind(this)

    this.onVerify = this.onVerify.bind(this)
    this.onDisverify = this.onDisverify.bind(this)

    this.onEditNewCounterJustification = this.onEditNewCounterJustification.bind(this)

    this.onUseJustification = this.onUseJustification.bind(this)
  }

  onCardMouseOver() {
    this.setState({isOver: true})
  }

  onCardMouseLeave() {
    this.setState({isOver: false})
  }

  onVerify() {
    const {justification} = this.props
    if (isVerified(justification)) {
      this.props.api.unVerifyJustification(justification)
    } else {
      this.props.api.verifyJustification(justification)
    }
  }

  onDisverify() {
    const {justification} = this.props
    if (isDisverified(justification)) {
      this.props.api.unDisverifyJustification(justification)
    } else {
      this.props.api.disverifyJustification(justification)
    }
  }

  deleteClick() {
    this.props.api.deleteJustification(this.props.justification)
  }

  onEditNewCounterJustification() {
    const justification = this.props.justification
    this.props.editors.beginEdit(EditorTypes.COUNTER_JUSTIFICATION, counterJustificationEditorId(justification), makeNewCounterJustification(justification))
  }

  onEditBasis() {
    const justificationBasis = this.props.justification.basis
    const basisEditorType = justificationBasis.type
    this.props.editors.beginEdit(basisEditorType, justificationBasisEditorId(justificationBasis), justificationBasis.entity)
  }

  onUseJustification() {
    const {
      type: basisType,
      entity: {
        id: basisId
      }
    } = this.props.justification.basis
    this.props.goto.createJustification(basisType, basisId)
  }

  render() {
    const {
      justification,
      positivey,
      newCounterJustification,
      isEditingBasis,
      showControls,
    } = this.props
    const _isVerified = isVerified(justification)
    const _isDisverified = isDisverified(justification)
    const {
      isOver,
    } = this.state

    const _isStatementCompoundBased = isStatementCompoundBased(justification)

    const menu = (
        <MenuButton
            icon
            id={`justification-${justification.id}-context-menu`}
            className={cn({hiding: !isOver})}
            menuClassName="contextMenu justificationContextMenu"
            buttonChildren={'more_vert'}
            position={Positions.TOP_RIGHT}
            children={[
              <ListItem primaryText="Counter"
                        key="counter"
                        leftIcon={<FontIcon>reply</FontIcon>}
                        onClick={this.onEditNewCounterJustification}
              />,
              <ListItem primaryText="Use"
                        key="use"
                        title="Justify another statement with this justification’s basis"
                        leftIcon={<FontIcon>call_made</FontIcon>}
                        onClick={this.onUseJustification}
              />,
              <ListItem primaryText="Link"
                        key="link"
                        title="A link to this justification"
                        leftIcon={<FontIcon>link</FontIcon>}
                        component="a"
                        href={paths.justification(justification)}
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
                inactive: !isOver,
                hiding: !_isVerified && !isOver,
                otherSelected: _isDisverified,
              })}
              title="Verify this justification"
              onClick={this.onVerify}
      >thumb_up</Button>,
      <Button icon
              key="disverifyButton"
              className={cn({
                disverified: _isDisverified,
                inactive: !isOver,
                hiding: !_isDisverified && !isOver,
                otherSelected: _isVerified,
              })}
              title="Dis-verify this justification"
              onClick={this.onDisverify}
      >thumb_down</Button>,
      <Button icon
              key="counterButton"
              className={cn({
                hiding: !isOver,
                otherSelected: _isVerified || _isDisverified,
              })}
              title="Counter this justification"
              onClick={this.onEditNewCounterJustification}
      >reply</Button>
    ]

    const card = (
        <Card className="justificationCard"
              id={`justification-${justification.id}`}
              onMouseOver={this.onCardMouseOver}
              onMouseLeave={this.onCardMouseLeave}
        >
          <div className="md-grid">
            <div className="md-cell md-cell--12">

              <div>
                {justification && !isEditingBasis && showControls && menu}
                <EditableJustificationBasis id={`justification-${justification.id}-basisEditor`}
                                            justification={justification}
                                            editorId={justificationBasisEditorId(justification.basis)}
                                            suggestionsKey={suggestionKeys.justificationBasisEditor(justification)}
                />
              </div>

            </div>
          </div>

          {showControls &&
            <CardActions className="actions">
              {!isEditingBasis && actions}
            </CardActions>
          }
        </Card>
    )

    const {flipMoveDuration, flipMoveEasing} = config.ui.statementJustifications
    const counterJustifications = (
        <div className="counterJustifications">
          <FlipMove duration={flipMoveDuration} easing={flipMoveEasing}>
            {newCounterJustification &&
              <Card id="newCounterJustificationCard" key="newCounterJustificationCard" className="justificationCard">
                <div className="md-grid">
                  <div className="md-cell md-cell--12">
                    <CounterJustificationEditor editorId={counterJustificationEditorId(justification)}
                                                textId={`justification=${justification.id}-newCounterJustification`}
                                                suggestionsKey={suggestionKeys.counterJustificationEditor(justification.id)}
                    />
                  </div>
                </div>
              </Card>
            }
            {map(justification.counterJustifications, j =>
                <div id={`counter-justification-${j.id}-row`} key={`counter-justification-${j.id}-row`} className="row">
                  <div className="col-xs-12">
                    <ConnectedJustificationWithCounters justification={j} positivey={!positivey} showControls={showControls} />
                  </div>
                </div>
            )}
          </FlipMove>
        </div>
    )

    return (
        <div id={`justification-${justification.id}-card-wrapper`} className={cn({
          justification: true,
          positivey: positivey,
          negativey: !positivey,
        })}>
          {card}
          {counterJustifications}
        </div>
    )
  }
}
JustificationWithCounters.propTypes = {
  showControls: PropTypes.bool
}
JustificationWithCounters.defaultProps = {
  showControls: true
}

const mapStateToProps = (state, ownProps) => {
  const justification = ownProps.justification
  const justificationBasis = justification.basis
  const basisEditorType = justificationBasis.type
  const editEntity = get(state, ['editors', basisEditorType, justificationBasisEditorId(justificationBasis), 'editEntity'])
  const isEditingBasis = !!editEntity

  const newCounterJustification = get(state, ['editors', EditorTypes.COUNTER_JUSTIFICATION, counterJustificationEditorId(justification), 'editEntity'])
  return {
    newCounterJustification,
    isEditingBasis,
  }
}

const ConnectedJustificationWithCounters = connect(mapStateToProps, mapActionCreatorGroupToDispatchToProps({
  api,
  editors,
  goto,
}))(JustificationWithCounters)

export default ConnectedJustificationWithCounters