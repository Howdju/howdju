import React, {Component} from "react";
import {connect} from "react-redux";
import {denormalize} from "normalizr";
import DocumentTitle from "react-document-title";
import Divider from "react-md/lib/Dividers";
import Card from "react-md/lib/Cards/Card";
import FontIcon from "react-md/lib/FontIcons";
import MenuButton from "react-md/lib/Menus/MenuButton";
import ListItem from "react-md/lib/Lists/ListItem";
import Dialog from 'react-md/lib/Dialogs'
import Positions from "react-md/lib/Menus/Positions";
import Button from 'react-md/lib/Buttons/Button'
import CircularProgress from 'react-md/lib/Progress/CircularProgress'
import groupBy from "lodash/groupBy";
import sortBy from "lodash/sortBy";
import toNumber from "lodash/toNumber";
import isFinite from "lodash/isFinite";
import forEach from 'lodash/forEach';
import some from 'lodash/some'
import defaults from 'lodash/defaults'
import classNames from 'classnames'
import FlipMove from 'react-flip-move';
import get from 'lodash/get'

import config from './config';

import {logger} from "./util";
import {
  isVerified,
  isDisverified,
  JustificationPolarity,
  isPositive,
  isNegative,
  JustificationBasisType,
  makeNewJustificationTargetingStatementId,
} from "./models";

import {
  api,
  editors, mapActionCreatorGroupToDispatchToProps,
  ui,
  goto, flows,
} from "./actions";
import {justificationSchema, statementSchema} from "./schemas";
import JustificationWithCounters from './JustificationWithCounters'
import text, {
  ADD_JUSTIFICATION_CALL_TO_ACTION,
  CANCEL_BUTTON_LABEL,
  CREATE_JUSTIFICATION_SUBMIT_BUTTON_LABEL, FETCH_STATEMENT_JUSTIFICATIONS_FAILURE_MESSAGE
} from "./texts";
import NewJustificationEditor from './NewJustificationEditor'
import {
  statementJustificationsPage_statementEditor_editorId,
  statementJustificationsPage_newJustificationDialog_newJustificationEditor_editorId
} from "./editorIds";
import {EditorTypes} from "./reducers/editors";
import EditableStatement from "./EditableStatement";

import "./StatementJustificationsPage.scss";
import {suggestionKeys} from "./autocompleter";
import {ESCAPE_KEY_CODE} from "./keyCodes";


class StatementJustificationsPage extends Component {
  constructor() {
    super()
    this.state = {
      isOverStatement: false,
    }

    this.statementEditorId = statementJustificationsPage_statementEditor_editorId
    this.newJustificationEditorId = statementJustificationsPage_newJustificationDialog_newJustificationEditor_editorId

    this.onStatementMouseOver = this.onStatementMouseOver.bind(this)
    this.onStatementMouseLeave = this.onStatementMouseLeave.bind(this)
    this.updateDimensions = this.updateDimensions.bind(this)
    this.onEditStatement = this.onEditStatement.bind(this)
    this.deleteStatement = this.deleteStatement.bind(this)
    this.onUseStatement = this.onUseStatement.bind(this)

    this.showNewJustificationDialog = this.showNewJustificationDialog.bind(this)
    this.onDialogEditorKeyDown = this.onDialogEditorKeyDown.bind(this)
    this.onSubmitNewJustificationDialog = this.onSubmitNewJustificationDialog.bind(this)
    this.cancelNewJustificationDialog = this.cancelNewJustificationDialog.bind(this)

    this.saveNewJustification = this.saveNewJustification.bind(this)
  }

  componentWillMount() {
    this.props.editors.init(EditorTypes.STATEMENT, this.statementEditorId, {entityId: this.statementId()})
    this.props.api.fetchStatementJustifications(this.statementId())
    this.updateDimensions()
  }

  componentDidMount() {
    window.addEventListener("resize", this.updateDimensions);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.updateDimensions);
  }

  statementId() {
    return this.props.match.params.statementId
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

  onEditStatement() {
    this.props.editors.beginEdit(EditorTypes.STATEMENT, this.statementEditorId, this.props.statement)
  }

  onUseStatement() {
    this.props.goto.createJustification(JustificationBasisType.STATEMENT, this.statementId())
  }

  deleteStatement() {
    this.props.api.deleteStatement(this.props.statement)
  }

  showNewJustificationDialog(e) {
    e.preventDefault()

    const newJustification = makeNewJustificationTargetingStatementId(this.statementId())
    this.props.editors.beginEdit(EditorTypes.NEW_JUSTIFICATION, this.newJustificationEditorId, newJustification)

    this.props.ui.showNewJustificationDialog(this.statementId())
  }

  onSubmitNewJustificationDialog(e) {
    e.preventDefault()
    this.saveNewJustification()
  }

  saveNewJustification() {
    this.props.flows.commitEditThenPutActionOnSuccess(EditorTypes.NEW_JUSTIFICATION, this.newJustificationEditorId, ui.hideNewJustificationDialog())
  }

  cancelNewJustificationDialog() {
    this.props.ui.hideNewJustificationDialog()
  }

  onDialogEditorKeyDown(event) {
    if (event.keyCode === ESCAPE_KEY_CODE) {
      // Stop the escape from closing the dialog
      event.stopPropagation()
    }
  }

  render () {
    const {
      statement,
      justifications,
      isFetching,
      didFail,
      isNewJustificationDialogVisible,
      isSavingNewJustification,
      match: {params: {statementId} },
      isEditingStatement,
    } = this.props

    const {narrowBreakpoint, flipMoveDuration, flipMoveEasing} = config.ui.statementJustifications

    const errorMessage = didFail ? text(FETCH_STATEMENT_JUSTIFICATIONS_FAILURE_MESSAGE) : ''

    const isNarrow = this.state.width <= narrowBreakpoint
    const defaultJustificationsByPolarity = {
      [JustificationPolarity.POSITIVE]: [],
      [JustificationPolarity.NEGATIVE]: [],
    }
    const justificationsByPolarity = isNarrow ?
        defaultJustificationsByPolarity :
        defaults(groupBy(justifications, j => j.polarity), defaultJustificationsByPolarity)


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
            id={`statement-${statementId}-context-menu`}
            className={classNames({hiding: !this.state.isOverStatement})}
            menuClassName="contextMenu statementContextMenu"
            buttonChildren={'more_vert'}
            position={Positions.TOP_RIGHT}
        >
          <ListItem primaryText="Add Justification"
                    leftIcon={<FontIcon>add</FontIcon>}
                    onClick={this.showNewJustificationDialog}
          />
          <ListItem primaryText="Use"
                    title="Justify another statement with this one"
                    leftIcon={<FontIcon>call_made</FontIcon>}
                    onClick={this.onUseStatement}
          />
          <Divider />
          <ListItem primaryText="Edit"
                    leftIcon={<FontIcon>create</FontIcon>}
                    onClick={this.onEditStatement}
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
                  <Button flat
                          label={text(CANCEL_BUTTON_LABEL)}
                          onClick={this.cancelNewJustificationDialog}
                          disabled={isSavingNewJustification}
                  />,
                  <Button raised
                          primary
                          type="submit"
                          label={text(CREATE_JUSTIFICATION_SUBMIT_BUTTON_LABEL)}
                          onClick={this.saveNewJustification}
                          disabled={isSavingNewJustification}
                  />
                ]}
        >
          <NewJustificationEditor editorId={this.newJustificationEditorId}
                                  suggestionsKey={suggestionKeys.statementJustificationsPage_newJustificationDialog_newJustificationEditor_suggestions}
                                  onSubmit={this.onSubmitNewJustificationDialog}
                                  doShowButtons={false}
                                  disabled={isSavingNewJustification}
                                  onKeyDown={this.onDialogEditorKeyDown}
          />
        </Dialog>
    )

    const twoColumnJustifications = [
      <div key="positive-justifications" className="col-xs-6">

        <FlipMove duration={flipMoveDuration} easing={flipMoveEasing}>
          {justificationsByPolarity[JustificationPolarity.POSITIVE].map(j => (
              <div className="row" key={j.id}>
                <div className="col-xs-12">
                  <JustificationWithCounters justification={j} positivey={true} />
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
                  <JustificationWithCounters justification={j} positivey={false} />
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
                  <JustificationWithCounters justification={j} positivey={isPositive(j)} />
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

                        {statement && !isEditingStatement && menu}
                        <EditableStatement id={`editableStatement-${statementId}`}
                                           entityId={statementId}
                                           editorId={this.statementEditorId}
                                           suggestionsKey={suggestionKeys.statementJustificationsPage_statementEditor}
                        />

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
            {!hasJustifications && !isFetching && !errorMessage &&

              <div className="row center-xs">
                <div className="col-xs-12">
                  <div>
                    <div>No justifications.</div>
                    <div>
                      <a onClick={this.showNewJustificationDialog} href="#">
                        {text(ADD_JUSTIFICATION_CALL_TO_ACTION)}
                      </a>
                    </div>

                  </div>
                </div>
              </div>
            }
            <div className="row">
              {isFetching && statement && <CircularProgress key="progress" id="statementJustificationsProgress" /> || justificationRows}
            </div>

            {addNewJustificationDialog}

          </div>

        </DocumentTitle>
    )
  }
}
StatementJustificationsPage.defaultProps = {
  isFetching: false,
  didFail: false,
  isNewJustificationDialogVisible: false,
  statement: null,
  justifications: [],
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
  const statementId = ownProps.match.params.statementId
  if (!statementId) {
    logger.error('Missing required statementId')
    return {}
  }
  const statement = state.entities.statements[statementId]

  const statementEditorState = get(state, ['editors', EditorTypes.STATEMENT, statementJustificationsPage_statementEditor_editorId])
  const statementEditorModel = get(statementEditorState, 'editEntity')
  const isFetchingStatement = get(statementEditorState, 'isFetching')
  const isEditingStatement = !!statementEditorModel

  let justifications = denormalize(state.entities.justificationsByRootStatementId[statementId], [justificationSchema], state.entities)
  justifications = sortJustifications(justifications)

  const {
    isSaving: isSavingNewJustification,
  } = get(state.editors, [EditorTypes.NEW_JUSTIFICATION, statementJustificationsPage_newJustificationDialog_newJustificationEditor_editorId], {})

  return {
    ...state.ui.statementJustificationsPage,
    statement: denormalize(statement, statementSchema, state.entities),
    justifications,
    isSavingNewJustification,
    isFetchingStatement,
    isEditingStatement,
  }
}

export default connect(mapStateToProps, mapActionCreatorGroupToDispatchToProps({
  api,
  ui,
  editors,
  goto,
  flows,
}))(StatementJustificationsPage)
