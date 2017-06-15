import cn from "classnames"
import PropTypes from 'prop-types'
import React, {Component} from "react"
import {connect} from "react-redux"
import Divider from "react-md/lib/Dividers"
import Card from "react-md/lib/Cards/Card"
import CardActions from "react-md/lib/Cards/CardActions"
import Button from "react-md/lib/Buttons"
import FontIcon from "react-md/lib/FontIcons"
import FocusContainer from 'react-md/lib/Helpers/FocusContainer'
import MenuButton from "react-md/lib/Menus/MenuButton"
import ListItem from "react-md/lib/Lists/ListItem"
import Positions from "react-md/lib/Menus/Positions"
import FlipMove from 'react-flip-move';
import set from 'lodash/set'
import forEach from 'lodash/forEach'
import cloneDeep from 'lodash/cloneDeep'

import {
  api,
  ui,
  editors, mapActionCreatorGroupToDispatchToProps, goto,
} from './actions'
import {
  JustificationBasisType,
  isVerified,
  isDisverified, isStatementBased, hasQuote,
} from './models'

import config from './config';

import CounterJustificationEditor from "./CounterJustificationEditor";
import {
  default as t, CANCEL_BUTTON_LABEL,
  CREATE_COUNTER_JUSTIFICATION_SUBMIT_BUTTON_LABEL, EDIT_JUSTIFICATION_SUBMIT_BUTTON_LABEL
} from "./texts";

import {logError} from "./util";
import JustificationBasisViewer from "./JustificationBasisViewer";
import JustificationBasisEditor from "./JustificationBasisEditor";


class JustificationWithCounters extends Component {
  constructor() {
    super()
    this.state = {
      isOver: false,
    }

    this.goToStatement = this.goToStatement.bind(this)
    this.deleteClick = this.deleteClick.bind(this)

    this.onBeginEditBasis = this.onBeginEditBasis.bind(this)
    this.onEditBasisPropertyChange = this.onEditBasisPropertyChange.bind(this)
    this.onCancelEditBasis = this.onCancelEditBasis.bind(this)
    this.onSaveEditBasis = this.onSaveEditBasis.bind(this)
    this.endEditBasis = this.endEditBasis.bind(this)

    this.onCardMouseOver = this.onCardMouseOver.bind(this)
    this.onCardMouseLeave = this.onCardMouseLeave.bind(this)

    this.onVerifyButtonClick = this.onVerifyButtonClick.bind(this)
    this.onDisverifyButtonClick = this.onDisverifyButtonClick.bind(this)

    this.onAddNewCounterJustification = this.onAddNewCounterJustification.bind(this)
    this.onNewCounterJustificationPropertyChange = this.onNewCounterJustificationPropertyChange.bind(this)
    this.onCreateCounterJustification = this.onCreateCounterJustification.bind(this)
    this.onCancelNewCounterJustification = this.onCancelNewCounterJustification.bind(this)

    this.onUseJustification = this.onUseJustification.bind(this)
  }

  onCardMouseOver() {
    this.setState({isOver: true})
  }

  onCardMouseLeave() {
    this.setState({isOver: false})
  }

  onVerifyButtonClick() {
    const {justification} = this.props
    if (isVerified(justification)) {
      this.props.api.unVerifyJustification(justification)
    } else {
      this.props.api.verifyJustification(justification)
    }
  }

  onDisverifyButtonClick() {
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

  goToStatement() {
    const basis = this.props.justification.basis
    if (basis.type === JustificationBasisType.STATEMENT) {
      this.props.goto.statement(basis.entity)
    }
  }

  onAddNewCounterJustification() {
    this.props.ui.addNewCounterJustification(this.props.justification)
  }

  onNewCounterJustificationPropertyChange(properties) {
    this.props.ui.newCounterJustificationPropertyChange(this.props.newCounterJustification, properties)
  }

  onCreateCounterJustification() {
    this.props.api.createJustification(this.props.newCounterJustification)
  }

  onCancelNewCounterJustification() {
    this.props.ui.cancelNewCounterJustification(this.props.newCounterJustification)
  }

  onBeginEditBasis() {
    this.setState({
      editBasis: cloneDeep(this.props.justification.basis.entity)
    })
  }

  onEditBasisPropertyChange(change) {
    const editBasis = cloneDeep(this.state.editBasis)
    forEach(change, (val, key) => {
      set(editBasis, key, val)
    })
    this.setState({editBasis})
  }

  onCancelEditBasis(event) {
    event.preventDefault()
    this.endEditBasis()
  }

  onSaveEditBasis(event) {
    event.preventDefault()

    const basisType = this.props.justification.basis.type
    const editBasis = this.state.editBasis
    switch (basisType) {
      case JustificationBasisType.STATEMENT:
        this.props.api.updateStatement(editBasis)
        break;
      case JustificationBasisType.CITATION_REFERENCE:
        this.props.api.updateCitationReference(editBasis)
        break;
      default:
        logError(`Unhandled justification basis type: ${basisType}`)
        break
    }

    this.endEditBasis()
  }

  endEditBasis() {
    this.setState({
      editBasis: null,
    })
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
      isCreatingNewCounterJustification,
      // TODO
      isUpdating,
    } = this.props
    const _isVerified = isVerified(justification)
    const _isDisverified = isDisverified(justification)
    const {
      isOver,
      editBasis,
    } = this.state

    const isEditing = !!editBasis

    const basisUseDescription = isStatementBased(justification) ?
        'Justify another statement with this one' :
        hasQuote(justification) ?
            'Justify a statement with this quote' :
            'Justify a statement with this citation'

    const menu = (
        <MenuButton
            icon
            id={`justification-${justification.id}-context-menu`}
            className={cn({hiding: !isOver})}
            menuClassName="contextMenu justificationContextMenu"
            buttonChildren={'more_vert'}
            position={Positions.TOP_RIGHT}
        >
          <ListItem primaryText="Go To"
                    leftIcon={<FontIcon>forward</FontIcon>}
                    onClick={this.goToStatement}
                    className={cn({hidden: !isStatementBased(justification)})}
          />
          <ListItem primaryText="Counter"
                    leftIcon={<FontIcon>reply</FontIcon>}
                    onClick={this.onAddNewCounterJustification}
          />
          <ListItem primaryText="Use"
                    title={basisUseDescription}
                    leftIcon={<FontIcon>call_made</FontIcon>}
                    onClick={this.onUseJustification}
          />
          <Divider />
          <ListItem primaryText="Edit"
                    leftIcon={<FontIcon>create</FontIcon>}
                    onClick={this.onBeginEditBasis}
          />
          <ListItem primaryText="Delete"
                    leftIcon={<FontIcon>delete</FontIcon>}
                    onClick={this.deleteClick}
          />
        </MenuButton>
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
              onClick={this.onVerifyButtonClick}
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
              onClick={this.onDisverifyButtonClick}
      >thumb_down</Button>,
      <Button icon
              key="counterButton"
              className={cn({
                hiding: !isOver,
                otherSelected: _isVerified || _isDisverified,
              })}
              title="Counter this justification"
              onClick={this.onAddNewCounterJustification}
      >reply</Button>
    ]

    const editingActions = [
      <Button flat
              key="cancelButton"
              label={t(CANCEL_BUTTON_LABEL)}
              onClick={this.onCancelEditBasis} />,
      <Button flat
              primary
              key="submitButton"
              type="submit"
              label={t(EDIT_JUSTIFICATION_SUBMIT_BUTTON_LABEL)}
              disabled={isUpdating}
      />
    ]

    const card = (
        <Card className="justificationCard"
              onMouseOver={this.onCardMouseOver}
              onMouseLeave={this.onCardMouseLeave}
        >
          <div className="md-grid">
            <div className="md-cell md-cell--12">

              <div>
                {!isEditing && menu}
                {isEditing ?
                    <JustificationBasisEditor justification={justification}
                                              editBasis={editBasis}
                                              onPropertyChange={this.onEditBasisPropertyChange}
                    /> :
                    <JustificationBasisViewer justification={justification}/>
                }
              </div>

            </div>
          </div>

          <CardActions className="actions">
            {isEditing ? editingActions : actions}
          </CardActions>
        </Card>
    )

    const form = (
        <form onSubmit={this.onSaveEditBasis}>
          {card}
        </form>
    )

    const {flipMoveDuration, flipMoveEasing} = config.ui.statementJustifications
    const counterJustifications = (
        <div className="counterJustifications">
          <FlipMove duration={flipMoveDuration} easing={flipMoveEasing}>
            {newCounterJustification &&
            <Card id="newCounterJustificationCard" key="newCounterJustificationCard" className="justificationCard">
              <div className="md-grid">
                <div className="md-cell md-cell--12">
                  <FocusContainer focusOnMount>
                    <CounterJustificationEditor counterJustification={newCounterJustification}
                                                onPropertyChange={this.onNewCounterJustificationPropertyChange}
                                                onSubmit={this.onCreateCounterJustification}
                    />
                  </FocusContainer>
                  <CardActions className="md-dialog-footer">
                    <Button flat label={t(CANCEL_BUTTON_LABEL)} onClick={this.onCancelNewCounterJustification} />
                    <Button flat
                            primary
                            type="submit"
                            label={t(CREATE_COUNTER_JUSTIFICATION_SUBMIT_BUTTON_LABEL)}
                            onClick={this.onCreateCounterJustification}
                            disabled={isCreatingNewCounterJustification}
                    />
                  </CardActions>
                </div>
              </div>
            </Card>
            }
            {justification.counterJustifications.map(j =>
                <div id={`counter-justification-${j.id}-row`} key={`counter-justification-${j.id}-row`} className="row">
                  <div className="col-xs-12">
                    <ConnectedJustificationWithCounters justification={j} positivey={!positivey} />
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
          {isEditing ? form : card}
          {counterJustifications}
        </div>
    )
  }
}
JustificationWithCounters.propTypes = {}

const mapStateToProps = (state, ownProps) => {
  // TODO
  // const {
  //   isEditing,
  //   editBasis,
  //   errorMessage,
  //   errorReasons,
  // } = state.editors.justificationBases[ownProps.id]
  const newCounterJustification = state.ui.statementJustificationsPage.newCounterJustificationsByTargetId[ownProps.justification.id]
  const isCreatingNewCounterJustification = state.ui.statementJustificationsPage.newCounterJustificationIsCreatingByTargetId[ownProps.justification.id]
  return {
    newCounterJustification,
    isCreatingNewCounterJustification,
  }
}

const ConnectedJustificationWithCounters = connect(mapStateToProps, mapActionCreatorGroupToDispatchToProps({
  api,
  editors,
  goto,
}))(JustificationWithCounters)

export default ConnectedJustificationWithCounters