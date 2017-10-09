import React, {Component} from "react"
import {connect} from "react-redux"
import {denormalize} from "normalizr"
import { Link } from 'react-router-dom'
import Helmet from "react-helmet"
import Divider from "react-md/lib/Dividers"
import FontIcon from "react-md/lib/FontIcons"
import MenuButton from "react-md/lib/Menus/MenuButton"
import ListItem from "react-md/lib/Lists/ListItem"
import Positions from "react-md/lib/Menus/Positions"
import Button from 'react-md/lib/Buttons/Button'
import CircularProgress from 'react-md/lib/Progress/CircularProgress'
import Card from 'react-md/lib/Cards/Card'
import CardText from 'react-md/lib/Cards/CardText'
import cn from 'classnames'
import concat from 'lodash/concat'
import every from 'lodash/every'
import forEach from 'lodash/forEach'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import isEqual from 'lodash/isEqual'
import map from 'lodash/map'
import some from 'lodash/some'
import sortBy from "lodash/sortBy"
import split from 'lodash/split'
import take from 'lodash/take'
import queryString from 'query-string'

import {
  isVerified,
  isDisverified,
  isPositive,
  isNegative,
  makeNewJustificationTargetingStatementId,
  makeNewJustificationTargetingStatementIdWithPolarity,
  JustificationPolarity,
  JustificationBasisSourceType,
} from "howdju-common"

import {logger} from "./logger"
import {
  api,
  editors, mapActionCreatorGroupToDispatchToProps,
  ui,
  goto, flows,
} from "./actions"
import {justificationsSchema, statementSchema} from "./schemas"
import paths from './paths'
import t, {
  ADD_JUSTIFICATION_CALL_TO_ACTION,
} from "./texts"
import {
  statementJustificationsPage_statementEditor_editorId,
  statementJustificationsPage_newJustificationDialog_newJustificationEditor_editorId
} from "./editorIds"
import {EditorTypes} from "./reducers/editors"
import {suggestionKeys} from "./autocompleter"
import {selectIsWindowNarrow} from "./selectors"

import NewJustificationDialog from './NewJustificationDialog'
import JustificationsTree from './JustificationsTree'

import "./StatementJustificationsPage.scss"
import StatementEntityViewer from './StatementEntityViewer'


const statementIdFromProps = (props) => props.match.params.statementId
const trailStatementIdsFromProps = (props) => {
  const queryParams = queryString.parse(props.location.search)
  const trailStatementIdsParam = queryParams['statement-trail']
  return trailStatementIdsParam ?
    split(trailStatementIdsParam, ',') :
    []
}

class StatementJustificationsPage extends Component {
  constructor() {
    super()
    this.state = {
      isOverStatement: false,
    }

    this.statementEditorId = statementJustificationsPage_statementEditor_editorId
    this.newJustificationEditorId = statementJustificationsPage_newJustificationDialog_newJustificationEditor_editorId
  }

  componentWillMount() {
    const statementId = statementIdFromProps(this.props)
    this.props.api.fetchStatementJustifications(statementId)

    const trailStatementIds = trailStatementIdsFromProps(this.props)
    if (!isEmpty(trailStatementIds)) {
      this.props.api.fetchStatements(trailStatementIds)
    }
  }

  componentWillReceiveProps(nextProps) {
    const statementId = statementIdFromProps(this.props)
    const nextStatementId = statementIdFromProps(nextProps)

    if (statementId !== nextStatementId) {
      this.props.api.fetchStatementJustifications(nextStatementId)
    }

    const trailStatementIds = trailStatementIdsFromProps(this.props)
    const nextTrailStatementIds = trailStatementIdsFromProps(nextProps)
    if (!isEqual(trailStatementIds, nextTrailStatementIds) && !isEmpty(nextTrailStatementIds)) {
      this.props.api.fetchStatements(nextTrailStatementIds)
    }
  }

  statementId = () => statementIdFromProps(this.props)

  onStatementMouseOver = () => {
    this.setState({isOverStatement: true})
  }

  onStatementMouseLeave = () => {
    this.setState({isOverStatement: false})
  }

  editStatement = () => {
    this.props.editors.beginEdit(EditorTypes.STATEMENT, this.statementEditorId, this.props.statement)
  }

  createJustificationPath = () => {
    return paths.createJustification(JustificationBasisSourceType.STATEMENT, this.statementId())
  }

  seeUsagesPath = () => {
    return paths.searchJustifications({statementId: this.statementId()})
  }

  deleteStatement = () => {
    this.props.api.deleteStatement(this.props.statement)
  }

  showNewJustificationDialog = () => {
    const newJustification = makeNewJustificationTargetingStatementId(this.statementId())
    this.props.editors.beginEdit(EditorTypes.NEW_JUSTIFICATION, this.newJustificationEditorId, newJustification)

    this.props.ui.showNewJustificationDialog(this.statementId())
  }

  showNewPositiveJustificationDialog = () => {
    const newJustification = makeNewJustificationTargetingStatementIdWithPolarity(this.statementId(), JustificationPolarity.POSITIVE)
    this.props.editors.beginEdit(EditorTypes.NEW_JUSTIFICATION, this.newJustificationEditorId, newJustification)

    this.props.ui.showNewJustificationDialog(this.statementId())
  }

  showNewNegativeJustificationDialog = () => {
    const newJustification = makeNewJustificationTargetingStatementIdWithPolarity(this.statementId(), JustificationPolarity.NEGATIVE)
    this.props.editors.beginEdit(EditorTypes.NEW_JUSTIFICATION, this.newJustificationEditorId, newJustification)

    this.props.ui.showNewJustificationDialog(this.statementId())
  }

  saveNewJustification = (event) => {
    event.preventDefault()
    this.props.flows.commitEditThenPutActionOnSuccess(EditorTypes.NEW_JUSTIFICATION, this.newJustificationEditorId, ui.hideNewJustificationDialog())
  }

  cancelNewJustificationDialog = () => {
    this.props.ui.hideNewJustificationDialog()
  }

  render () {
    const {
      statementId,
      statement,
      trailStatements,
      justifications,

      isFetchingStatement,
      didFetchingStatementFail,

      isNewJustificationDialogVisible,
      isWindowNarrow,
    } = this.props
    const {
      isOverStatement,
    } = this.state

    const doHideControls = !isOverStatement && !isWindowNarrow

    const hasJustifications = !isEmpty(justifications)
    const hasAgreement = some(justifications, j => isVerified(j) && isPositive(j))
    const hasDisagreement = some(justifications, j => isVerified(j) && isNegative(j))

    const newTrailStatements = concat(trailStatements, [statement])

    const menu = (
      <MenuButton
        icon
        id={`statement-${statementId}-context-menu`}
        className={cn({hidden: doHideControls})}
        menuClassName="context-menu context-menu--statement"
        buttonChildren={'more_vert'}
        position={Positions.TOP_RIGHT}
        children={[
          <ListItem primaryText="Add justification"
                    key="addJustification"
                    leftIcon={<FontIcon>add</FontIcon>}
                    onClick={this.showNewJustificationDialog}
          />,
          <ListItem primaryText="Use"
                    key="use"
                    title="Justify another statement with this one"
                    leftIcon={<FontIcon>call_made</FontIcon>}
                    component={Link}
                    to={this.createJustificationPath()}
          />,
          <ListItem primaryText="See usages"
                    key="usages"
                    title="See justifications using this statement"
                    leftIcon={<FontIcon>call_merge</FontIcon>}
                    component={Link}
                    to={this.seeUsagesPath()}
          />,
          <Divider key="divider" />,
          <ListItem primaryText="Edit"
                    key="edit"
                    leftIcon={<FontIcon>create</FontIcon>}
                    onClick={this.editStatement}
          />,
          <ListItem primaryText="Delete"
                    key="delete"
                    leftIcon={<FontIcon>delete</FontIcon>}
                    onClick={this.deleteStatement}
          />,
        ]}
      />
    )

    return (
      <div id="statement-justifications">
        <Helmet>
          <title>{statement ? statement.text : 'Loading statement'} — Howdju</title>
        </Helmet>

        <div className="md-grid md-grid--top">
          {trailStatements.length > 0 && every(trailStatements) && (
            <ul className="md-cell md-cell--12 statement-trail">
              {map(trailStatements, (trailStatement, index) => (
                <li key={index}>
                  <Link to={paths.statement(trailStatement, take(trailStatements, index))}>
                    {trailStatement.text}
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <div className="md-cell md-cell--12">

            <div className="statement">

              <Card
                className={cn('statement-card', {
                  agreement: hasAgreement,
                  disagreement: hasDisagreement,
                })}
                onMouseOver={this.onStatementMouseOver}
                onMouseLeave={this.onStatementMouseLeave}
              >
                <StatementEntityViewer
                  component={CardText}
                  id={`editableStatement-${statementId}`}
                  statement={statement}
                  editorId={this.statementEditorId}
                  suggestionsKey={suggestionKeys.statementJustificationsPage_statementEditor}
                  doShowControls={true}
                  menu={menu}
                  trailStatements={trailStatements}
                />
              </Card>

            </div>

          </div>

          {!hasJustifications && !isFetchingStatement && !didFetchingStatementFail && [
            <div className="md-cell md-cell--12 cell--centered-contents"
                 key="justification-statements-page-no-justifications-message"
            >
              <div>No justifications.</div>
            </div>,
            <div className="md-cell md-cell--12 cell--centered-contents"
                 key="justification-statements-page-no-justifications-add-justification-button"
            >
              <Button flat
                      label={t(ADD_JUSTIFICATION_CALL_TO_ACTION)}
                      onClick={this.showNewJustificationDialog}
              />
            </div>
          ]}
        </div>

        {isFetchingStatement && (
          <div className="md-grid md-grid--bottom">
            <div className="md-cell md-cell--12 cell--centered-contents">
              <CircularProgress key="progress" id="statementJustificationsProgress" />
            </div>
          </div>
        )}

        <JustificationsTree
          justifications={justifications}
          doShowControls={true}
          doShowJustifications={false}
          isUnCondensed={true}
          showNewPositiveJustificationDialog={this.showNewPositiveJustificationDialog}
          showNewNegativeJustificationDialog={this.showNewNegativeJustificationDialog}
          trailStatements={newTrailStatements}
          className="md-grid--bottom"
        />

        <NewJustificationDialog
          id="add-new-justification-dialog-editor"
          editorId={this.newJustificationEditorId}
          suggestionsKey={suggestionKeys.statementJustificationsPage_newJustificationDialog_newJustificationEditor_suggestions}
          visible={isNewJustificationDialogVisible}
          onCancel={this.cancelNewJustificationDialog}
          onSubmit={this.saveNewJustification}
          onHide={this.cancelNewJustificationDialog}
        />

      </div>
    )
  }
}
StatementJustificationsPage.transientId = 'statement-justifications-page-statement'

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
  const statement = denormalize(statementId, statementSchema, state.entities)
  const trailStatements = map(trailStatementIdsFromProps(ownProps), statementId => state.entities.statements[statementId])

  const statementEditorState = get(state, ['editors', EditorTypes.STATEMENT, statementJustificationsPage_statementEditor_editorId])

  const isFetchingStatement = get(statementEditorState, 'isFetching')
  const didFetchingStatementFail = get(statementEditorState, ['errors', 'hasErrors'], false)

  let justifications = denormalize(state.entities.justificationsByRootStatementId[statementId], justificationsSchema, state.entities)
  justifications = sortJustifications(justifications)

  const isWindowNarrow = selectIsWindowNarrow(state)

  return {
    ...state.ui.statementJustificationsPage,
    statementId,
    statement,
    trailStatements,
    justifications,
    isFetchingStatement,
    didFetchingStatementFail,
    isWindowNarrow,
  }
}

export default connect(mapStateToProps, mapActionCreatorGroupToDispatchToProps({
  api,
  ui,
  editors,
  goto,
  flows,
}))(StatementJustificationsPage)
