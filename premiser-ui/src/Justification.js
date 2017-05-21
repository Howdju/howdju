import classNames from "classnames"
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
import {
  verifyJustification,
  disverifyJustification,
  unVerifyJustification,
  unDisverifyJustification,
  deleteJustification,
  addNewCounterJustification,
  newCounterJustificationPropertyChange,
  createJustification,
  cancelNewCounterJustification, viewStatement,
} from './actions'
import {
  JustificationBasisType,
  isVerified,
  isDisverified, isStatementBased,
} from './models'
import {extractDomain} from './util'
import FlipMove from 'react-flip-move';
import config from './config';

import './Justification.scss'
import CounterJustificationEditor from "./CounterJustificationEditor";
import {
  default as t, CANCEL_BUTTON_LABEL, CREATE_JUSTIFICATION_SUBMIT_BUTTON_LABEL,
  CREATE_COUNTER_JUSTIFICATION_SUBMIT_BUTTON_LABEL
} from "./texts";

class Justification extends Component {
  constructor() {
    super()
    this.state = {isOver: false}
    this.onCardMouseOver = this.onCardMouseOver.bind(this)
    this.onCardMouseLeave = this.onCardMouseLeave.bind(this)
    this.onVerifyButtonClick = this.onVerifyButtonClick.bind(this)
    this.onDisverifyButtonClick = this.onDisverifyButtonClick.bind(this)
    this.deleteClick = this.deleteClick.bind(this)
    this.onAddNewCounterJustification = this.onAddNewCounterJustification.bind(this)
    this.onNewCounterJustificationPropertyChange = this.onNewCounterJustificationPropertyChange.bind(this)
    this.onCreateCounterJustification = this.onCreateCounterJustification.bind(this)
    this.onCancelNewCounterJustification = this.onCancelNewCounterJustification.bind(this)
    this.goToStatement = this.goToStatement.bind(this)
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
      this.props.unVerifyJustification(justification)
    } else {
      this.props.verifyJustification(justification)
    }
  }

  onDisverifyButtonClick() {
    const {justification} = this.props
    if (isDisverified(justification)) {
      this.props.unDisverifyJustification(justification)
    } else {
      this.props.disverifyJustification(justification)
    }
  }

  deleteClick() {
    this.props.deleteJustification(this.props.justification)
  }

  goToStatement() {
    const basis = this.props.justification.basis
    if (basis.type === JustificationBasisType.STATEMENT) {
      this.props.viewStatement(basis.entity)
    }
  }

  onAddNewCounterJustification() {
    this.props.addNewCounterJustification(this.props.justification)
  }

  onNewCounterJustificationPropertyChange(properties) {
    this.props.newCounterJustificationPropertyChange(this.props.newCounterJustification, properties)
  }

  onCreateCounterJustification() {
    this.props.createJustification(this.props.newCounterJustification)
  }

  onCancelNewCounterJustification() {
    this.props.cancelNewCounterJustification(this.props.newCounterJustification)
  }

  render() {
    const {
      justification,
      withCounterJustifications,
      positivey,
      newCounterJustification,
      isCreatingNewCounterJustification,
    } = this.props
    const _isVerified = isVerified(justification)
    const _isDisverified = isDisverified(justification)
    const {isOver} = this.state
    const justificationClasses = classNames({
      justification: true,
      positivey: positivey,
      negativey: !positivey,
    })
    const justificationTextClasses = classNames({
      justificationText: true,
      quote: justification.basis.type === JustificationBasisType.CITATION_REFERENCE,
    })

    const text = justification.basis.type === JustificationBasisType.STATEMENT ?
        justification.basis.entity.text :
        justification.basis.entity.quote
    const urls = justification.basis.type === JustificationBasisType.CITATION_REFERENCE ?
        justification.basis.entity.urls.map(u =>
            <li id={`url-${u.id}-list-item`} key={`url-${u.id}-list-item`} className="url">
              <a href={u.url}>
                {extractDomain(u.url)}
                <FontIcon>open_in_new</FontIcon>
              </a>
            </li>
        ) :
        null
    const citationTitle = justification.basis.type === JustificationBasisType.CITATION_REFERENCE ?
        justification.basis.entity.citation.text :
        null

    const menu = (
        <MenuButton
            icon
            id={`justification-${justification.id}-context-menu`}
            className={classNames({hiding: !isOver})}
            menuClassName="contextMenu justificationContextMenu"
            buttonChildren={'more_vert'}
            position={Positions.TOP_RIGHT}
        >
          <ListItem primaryText="Go To"
                    leftIcon={<FontIcon>forward</FontIcon>}
                    onClick={this.goToStatement}
                    className={classNames({hidden: !isStatementBased(justification)})}
          />
          <ListItem primaryText="Counter" leftIcon={<FontIcon>reply</FontIcon>} />
          <ListItem primaryText="Use" leftIcon={<FontIcon>call_made</FontIcon>} />
          <Divider />
          <ListItem primaryText="Edit" leftIcon={<FontIcon>create</FontIcon>} />
          <ListItem primaryText="Delete"
                    leftIcon={<FontIcon>delete</FontIcon>}
                    onClick={this.deleteClick}
          />
        </MenuButton>
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
                  <ConnectedJustification withCounterJustifications={withCounterJustifications}
                                          justification={j}
                                          positivey={!positivey}
                  />
                </div>
              </div>
            )}
          </FlipMove>
        </div>
    )

    return (
        <div id={`justification-${justification.id}-card-wrapper`} className={justificationClasses}>
          <Card className="justificationCard"
                onMouseOver={this.onCardMouseOver}
                onMouseLeave={this.onCardMouseLeave}
          >

            <div className="md-grid">
              <div className="md-cell md-cell--12">

                <div>
                  {menu}
                  <div className={justificationTextClasses}>
                    <span>{text}</span>
                  </div>
                  {citationTitle &&
                    <div className="citationTitle">{citationTitle}</div>
                  }
                  {urls &&
                    <ul>
                      {urls}
                    </ul>
                  }
                </div>

              </div>
            </div>

            <CardActions className="actions">
              <Button icon
                      className={classNames({
                        verified: _isVerified,
                        inactive: !isOver,
                        hiding: _isDisverified && !isOver,
                        otherSelected: _isDisverified,
                      })}
                      title="Verify this justification"
                      onClick={this.onVerifyButtonClick}
              >thumb_up</Button>
              <Button icon
                      className={classNames({
                        disverified: _isDisverified,
                        inactive: !isOver,
                        hiding: _isVerified && !isOver,
                        otherSelected: _isVerified,
                      })}
                      title="Dis-verify this justification"
                      onClick={this.onDisverifyButtonClick}
              >thumb_down</Button>
              <Button icon
                      className={classNames({
                        hiding: !isOver,
                        otherSelected: _isVerified || _isDisverified,
                      })}
                      title="Counter this justification"
                      onClick={this.onAddNewCounterJustification}
              >reply</Button>
            </CardActions>
          </Card>
          {withCounterJustifications && counterJustifications}
        </div>
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  const newCounterJustification = state.ui.statementJustificationsPage.newCounterJustificationsByTargetId[ownProps.justification.id]
  const isCreatingNewCounterJustification = state.ui.statementJustificationsPage.newCounterJustificationIsCreatingByTargetId[ownProps.justification.id]
  return {
    newCounterJustification,
    isCreatingNewCounterJustification,
  }
}

const ConnectedJustification = connect(mapStateToProps, {
  verifyJustification,
  unVerifyJustification,
  disverifyJustification,
  unDisverifyJustification,
  deleteJustification,
  addNewCounterJustification,
  newCounterJustificationPropertyChange,
  createJustification,
  cancelNewCounterJustification,
  viewStatement,
})(Justification)

export default ConnectedJustification