import React, {Component} from "react";
import {connect} from "react-redux";
import {denormalize} from "normalizr";
import DocumentTitle from "react-document-title";
import Divider from "react-md/lib/Dividers";
import Card from "react-md/lib/Cards/Card";
import FontIcon from "react-md/lib/FontIcons";
import CircularProgress from "react-md/lib/Progress/CircularProgress";
import MenuButton from "react-md/lib/Menus/MenuButton";
import ListItem from "react-md/lib/Lists/ListItem";
import Dialog from 'react-md/lib/Dialogs'
import Positions from "react-md/lib/Menus/Positions";
import Button from 'react-md/lib/Buttons'
import groupBy from "lodash/groupBy";
import sortBy from "lodash/sortBy";
import toNumber from "lodash/toNumber";
import isFinite from "lodash/isFinite";
import forEach from 'lodash/forEach';
import some from 'lodash/some'
import defaults from 'lodash/defaults'
import classNames from 'classnames'
import FlipMove from 'react-flip-move';
import config from './config';

import {logError} from "./util";
import {
  isVerified,
  isDisverified,
  JustificationPolarity,
  isPositive,
  isNegative,
  consolidateBasis,
} from "./models";

import {
  acceptJustification,
  deleteStatement,
  fetchStatementJustifications,
  rejectJustification,
  createJustification,
  editJustificationPropertyChange,
  resetEditJustification,
  showNewJustificationDialog,
  hideNewJustificationDialog,
  editJustificationAddUrl,
  editJustificationDeleteUrl, doEditStatement,
} from "./actions";
import {justificationSchema, statementSchema} from "./schemas";
import Justification from './Justification'
import text, {
  ADD_JUSTIFICATION_CALL_TO_ACTION,
  CANCEL_BUTTON_LABEL,
  CREATE_JUSTIFICATION_SUBMIT_BUTTON_LABEL, FETCH_STATEMENT_JUSTIFICATIONS_FAILURE_MESSAGE
} from "./texts";
import JustificationEditor from './JustificationEditor'

import "./StatementJustificationsPage.scss";
import {statementJustificationsPageJustificationEditorId} from "./editorIds";

class StatementJustificationsPage extends Component {
  constructor() {
    super()
    this.state = {
      isOverStatement: false,
    }

    this.onStatementMouseOver = this.onStatementMouseOver.bind(this)
    this.onStatementMouseLeave = this.onStatementMouseLeave.bind(this)
    this.updateDimensions = this.updateDimensions.bind(this)
    this.doEditStatement = this.doEditStatement.bind(this)
    this.deleteStatement = this.deleteStatement.bind(this)

    this.showNewJustificationDialog = this.showNewJustificationDialog.bind(this)
    this.onNewJustificationPropertyChange = this.onNewJustificationPropertyChange.bind(this)
    this.addNewJustificationUrl = this.addNewJustificationUrl.bind(this)
    this.deleteNewJustificationUrl = this.deleteNewJustificationUrl.bind(this)
    this.saveNewJustification = this.saveNewJustification.bind(this)
    this.onSubmitNewJustificationDialog = this.onSubmitNewJustificationDialog.bind(this)
    this.cancelNewJustificationDialog = this.cancelNewJustificationDialog.bind(this)
  }

  componentWillMount() {
    this.props.fetchStatementJustifications(this.props.match.params.statementId)
    this.updateDimensions()
  }

  componentDidMount() {
    window.addEventListener("resize", this.updateDimensions);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.updateDimensions);
  }

  onStatementMouseOver() {
    this.setState({isOverStatement: true})
  }

  onStatementMouseLeave() {
    this.setState({isOverStatement: false})
  }

  updateDimensions() {
    this.setState({width: window.innerWidth, height: window.innerHeight});
  }

  doEditStatement() {
    this.props.doEditStatement(this.props.statement.id)
  }

  deleteStatement() {
    this.props.deleteStatement(this.props.statement)
  }

  showNewJustificationDialog(e) {
    e.preventDefault()
    this.props.showNewJustificationDialog(this.props.match.params.statementId)
  }

  onNewJustificationPropertyChange(properties) {
    this.props.editJustificationPropertyChange(statementJustificationsPageJustificationEditorId, properties)
  }

  addNewJustificationUrl() {
    this.props.addNewJustificationUrl(this.justificationEditorId)
  }

  deleteNewJustificationUrl(url, index) {
    this.props.editJustificationDeleteUrl(statementJustificationsPageJustificationEditorId, url, index)
  }

  onSubmitNewJustificationDialog(e) {
    e.preventDefault()
    this.saveNewJustification()
  }

  saveNewJustification() {
    const newJustification = consolidateBasis(this.props.newJustification)
    this.props.createJustification(newJustification)
  }

  cancelNewJustificationDialog() {
    this.props.hideNewJustificationDialog()
    this.props.resetEditJustification()
  }

  render () {
    const {
      statement,
      justifications,
      isFetching,
      didFail,
      isNewJustificationDialogVisible,
      newJustificationErrorMessage,
      isCreatingNewJustification,
      newJustification,
    } = this.props

    const {narrowBreakpoint, flipMoveDuration, flipMoveEasing} = config.ui.statementJustifications

    const errorMessage = didFail ? text(FETCH_STATEMENT_JUSTIFICATIONS_FAILURE_MESSAGE) : ''

    const isNarrow = this.state.width <= narrowBreakpoint
    const defaultjustificationsByPolarity = {
      [JustificationPolarity.POSITIVE]: [],
      [JustificationPolarity.NEGATIVE]: [],
    }
    const justificationsByPolarity = isNarrow ?
        defaultjustificationsByPolarity :
        defaults(groupBy(justifications, j => j.polarity), defaultjustificationsByPolarity)


    const hasJustifications = justifications && justifications.length > 0
    const hasAgreement = some(justifications, j => isVerified(j) && isPositive(j))
    const hasDisagreement = some(justifications, j => isVerified(j) && isNegative(j))

    const statementCardClassNames = classNames({
      statementCard: true,
      agreement: hasAgreement,
      disagreement: hasDisagreement,
    })
    const menu = (
        <MenuButton
            icon
            id={`statement-${statement && statement.id}-context-menu`}
            className={classNames({hiding: !this.state.isOverStatement})}
            menuClassName="contextMenu statementContextMenu"
            buttonChildren={'more_vert'}
            position={Positions.TOP_RIGHT}
        >
          <ListItem primaryText="Add Justification"
                    leftIcon={<FontIcon>add</FontIcon>}
                    onClick={this.showNewJustificationDialog}
          />
          <ListItem primaryText="Use" leftIcon={<FontIcon>call_made</FontIcon>} />
          <Divider />
          <ListItem primaryText="Edit"
                    leftIcon={<FontIcon>create</FontIcon>}
                    onClick={this.doEditStatement}
          />
          <ListItem primaryText="Delete"
                    leftIcon={<FontIcon>delete</FontIcon>}
                    onClick={this.deleteStatement}
          />
        </MenuButton>
    )

    const addNewJustificationDialog = (
        <Dialog id="newJustificationDialog"
                visible={isNewJustificationDialogVisible}
                title="Add justification"
                onHide={this.cancelNewJustificationDialog}
                actions={[
                  <Button flat label={text(CANCEL_BUTTON_LABEL)} onClick={this.cancelNewJustificationDialog} />,
                  <Button flat
                          primary
                          type="submit"
                          label={text(CREATE_JUSTIFICATION_SUBMIT_BUTTON_LABEL)}
                          onClick={this.saveNewJustification}
                          disabled={isCreatingNewJustification}
                  />
                ]}
        >
          <div className={classNames({
            errorMessage: true,
            hidden: !newJustificationErrorMessage
          })}>
            {newJustificationErrorMessage}
          </div>

          <form onSubmit={this.onSubmitNewJustificationDialog}>
            <JustificationEditor justification={newJustification}
                                 onPropertyChange={this.onNewJustificationPropertyChange}
                                 onAddUrlClick={this.addNewJustificationUrl}
                                 onDeleteUrlClick={this.deleteNewJustificationUrl}
            />
          </form>

        </Dialog>
    )

    const twoColumnJustifications = [
      <div key="positive-justifications" className="col-xs-6">

        <FlipMove duration={flipMoveDuration} easing={flipMoveEasing}>
          {justificationsByPolarity[JustificationPolarity.POSITIVE].map(j => (
              <div className="row" key={j.id}>
                <div className="col-xs-12">
                  <Justification withCounterJustifications key={j.id} justification={j} positivey={true} />
                </div>
              </div>
          ))}
        </FlipMove>

      </div>,
      <div key="negative-justifications" className="col-xs-6">

        <FlipMove duration={flipMoveDuration} easing={flipMoveEasing}>
          {justificationsByPolarity[JustificationPolarity.NEGATIVE].map(j => (
              <div className="row" key={j.id}>
                <div className="col-xs-12">
                  <Justification withCounterJustifications key={j.id} justification={j} positivey={false} />
                </div>
              </div>
          ))}
        </FlipMove>

      </div>
    ]
    const singleColumnJustifications = (
      <div key="justifications" className="col-xs-12">

        <FlipMove duration={flipMoveDuration} easing={flipMoveEasing}>
          {justifications.map(j => (
              <div className="row" key={j.id}>
                <div className="col-xs-12">
                  <Justification withCounterJustifications justification={j} positivey={isPositive(j)} />
                </div>
              </div>
          ))}
        </FlipMove>

      </div>
    )
    const justificationRows = isNarrow ? singleColumnJustifications : twoColumnJustifications

    return (
        <DocumentTitle title={`${statement ? statement.text : 'Loading statement'} - Howdju`}>
          <div className="statement-justifications">

            <div className="row">

              <div className="col-xs-12">

                <div className="statement">

                  <Card className={statementCardClassNames}
                      onMouseOver={this.onStatementMouseOver}
                      onMouseLeave={this.onStatementMouseLeave}
                  >

                    <div className="md-grid">
                      <div className="md-cell md-cell--12 statementText">

                        {statement && menu}
                        {statement ?
                            statement.text :
                            isFetching ?
                                <CircularProgress id="fetchingStatementProgress" /> :
                                ''
                        }

                      </div>
                    </div>

                  </Card>

                </div>

              </div>
            </div>

            {errorMessage &&
                <div className="row center-xs">
                  <div className="col-xs-12 errorMessage">
                    {errorMessage}
                  </div>
                </div>
            }
            {!errorMessage && !hasJustifications &&

              <div className="row center-xs">
                <div className="col-xs-12">
                  {isFetching ?
                      // Only show progress if we are not also showing one for the statement
                      !!statement && <CircularProgress id="fetchingJustificationsProgress" /> :
                      <div>
                        <div>No justifications.</div>
                        <div>
                          <a onClick={this.showNewJustificationDialog} href="#">
                            {text(ADD_JUSTIFICATION_CALL_TO_ACTION)}
                          </a>
                        </div>

                      </div>
                  }
                </div>
              </div>
            }
            <div className="row">
              {justificationRows}
            </div>

            {addNewJustificationDialog}

          </div>

        </DocumentTitle>
    )
  }
}

const sortJustifications = justifications => {
  justifications = sortBy(justifications, j => j.score)
  justifications = sortBy(justifications, j => isDisverified(j) ? 1 : isVerified(j) ? -1 : 0)
  forEach(justifications, j => {
    j.counterJustifications = sortJustifications(j.counterJustifications)
  })
  return justifications
}

const mapStateToProps = (state, ownProps) => {
  const statementId = toNumber(ownProps.match.params.statementId)
  if (!statementId) {
    logError('Missing required statementId')
    return {}
  }
  if (!isFinite(statementId)) {
    logError(`Invalid statementId: ${ownProps.match.params.statementId}`)
    return {}
  }

  let {isFetching} = state.ui.statementJustificationsPage
  const statement = state.entities.statements[statementId]
  if (!statement && !isFetching) {
    // The component may just be mounting
    return {}
  }

  let justifications = denormalize(state.entities.justificationsByRootStatementId[statementId], [justificationSchema], state.entities)

  justifications = sortJustifications(justifications)
  const props = {
    ...state.ui.statementJustificationsPage,
    isCreatingNewJustification: false,
    statement: denormalize(statement, statementSchema, state.entities),
    justifications,
  }
  return props
}

StatementJustificationsPage.defaultProps = {
  isFetching: false,
  didFail: false,
  isNewJustificationDialogVisible: false,
  statement: null,
  justifications: [],
}

export default connect(mapStateToProps, {
  fetchStatementJustifications,
  acceptJustification,
  rejectJustification,
  doEditStatement,
  deleteStatement,
  createJustification,
  editJustificationPropertyChange,
  editJustificationAddUrl,
  editJustificationDeleteUrl,
  resetEditJustification,
  showNewJustificationDialog,
  hideNewJustificationDialog,
})(StatementJustificationsPage)
