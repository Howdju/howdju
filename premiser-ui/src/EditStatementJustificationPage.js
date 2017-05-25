import React, {Component} from "react"
import Button from 'react-md/lib/Buttons'
import { connect } from 'react-redux'
import DocumentTitle from 'react-document-title'
import Card from 'react-md/lib/Cards'
import CardTitle from 'react-md/lib/Cards/CardTitle';
import CardActions from 'react-md/lib/Cards/CardActions';
import CardText from 'react-md/lib/Cards/CardText';
import cn from 'classnames'
import Divider from 'react-md/lib/Dividers'
import { Switch } from 'react-md/lib/SelectionControls'
import isNil from "lodash/isNil";

import {
  createStatement,
  createStatementJustification,
  updateStatement,
  editStatementPropertyChange,
  editJustificationPropertyChange,
  editJustificationAddUrl,
  editJustificationDeleteUrl,
  fetchStatementForEdit,
} from './actions'
import text, {
  ADD_JUSTIFICATION_TO_CREATE_STATEMENT, CREATE_JUSTIFICATION_SUBMIT_BUTTON_LABEL,
  CREATE_JUSTIFICATION_SUBMIT_BUTTON_TITLE, CREATE_JUSTIFICATION_TITLE,
  CREATE_STATEMENT_SUBMIT_BUTTON_LABEL,
  CREATE_STATEMENT_SUBMIT_BUTTON_TITLE, CREATE_STATEMENT_TITLE,
  EDIT_STATEMENT_SUBMIT_BUTTON_LABEL,
  EDIT_STATEMENT_SUBMIT_BUTTON_TITLE, EDIT_STATEMENT_TITLE,
} from "./texts";
import { suggestionKeys } from './autocompleter'
import JustificationEditor from './JustificationEditor'
import {consolidateBasis} from "./models";
import {
  editStatementJustificationPageStatementEditorId,
  editStatementJustificationPageJustificationEditorId
} from "./editorIds"
import StatementEditor from "./StatementEditor";
import {goBack} from "react-router-redux";
import {logger} from "./util";

export const EditStatementJustificationPageMode = {
  /** Blank editors, optionally show and create a justification with the statement */
  CREATE_STATEMENT: 'CREATE_STATEMENT',
  /** Hide justification editor */
  EDIT_STATEMENT: 'EDIT_STATEMENT',
  /** Blank statement editor, pre-populated justification information (e.g. citation reference from bookmarklet) */
  CREATE_JUSTIFICATION: 'CREATE_JUSTIFICATION',
}

const titleTextKeyByMode = {
  [EditStatementJustificationPageMode.CREATE_STATEMENT]: CREATE_STATEMENT_TITLE,
  [EditStatementJustificationPageMode.EDIT_STATEMENT]: EDIT_STATEMENT_TITLE,
  [EditStatementJustificationPageMode.CREATE_JUSTIFICATION]: CREATE_JUSTIFICATION_TITLE,
}
const submitButtonLabelTextKeyByMode = {
  [EditStatementJustificationPageMode.CREATE_STATEMENT]: CREATE_STATEMENT_SUBMIT_BUTTON_LABEL,
  [EditStatementJustificationPageMode.EDIT_STATEMENT]: EDIT_STATEMENT_SUBMIT_BUTTON_LABEL,
  [EditStatementJustificationPageMode.CREATE_JUSTIFICATION]: CREATE_JUSTIFICATION_SUBMIT_BUTTON_LABEL,
}
const submitButtonTitleTextKeyByMode = {
  [EditStatementJustificationPageMode.CREATE_STATEMENT]: CREATE_STATEMENT_SUBMIT_BUTTON_TITLE,
  [EditStatementJustificationPageMode.EDIT_STATEMENT]: EDIT_STATEMENT_SUBMIT_BUTTON_TITLE,
  [EditStatementJustificationPageMode.CREATE_JUSTIFICATION]: CREATE_JUSTIFICATION_SUBMIT_BUTTON_TITLE,
}

class EditStatementJustificationPage extends Component {

  constructor() {
    super()

    this.state = {
      doShowCreateJustificationSwitch: false,
      doCreateJustification: false,
    }

    this.onStatementPropertyChange = this.onStatementPropertyChange.bind(this)

    this.onDoCreateJustificationSwitchClick = this.onDoCreateJustificationSwitchClick.bind(this)

    this.onJustificationPropertyChange = this.onJustificationPropertyChange.bind(this)
    this.addJustificationUrl = this.addJustificationUrl.bind(this)
    this.deleteJustificationUrl = this.deleteJustificationUrl.bind(this)

    this.onSubmit = this.onSubmit.bind(this)
    this.onCancel = this.onCancel.bind(this)

    this.statementEditorId = editStatementJustificationPageStatementEditorId
    this.justificationEditorId = editStatementJustificationPageJustificationEditorId
  }

  componentWillMount() {
    switch (this.props.mode) {
      case EditStatementJustificationPageMode.EDIT_STATEMENT:
        const statementId = this.props.match.params.statementId
        this.props.fetchStatementForEdit(statementId)
        break
    }
  }

  componentWillReceiveProps(nextProps) {
    this.logPropProblems(nextProps)
  }

  onStatementPropertyChange(change) {
    this.props.editStatementPropertyChange(this.statementEditorId, change)
  }

  onSubmit(event) {
    event.preventDefault()

    switch (this.props.mode) {
      case EditStatementJustificationPageMode.EDIT_STATEMENT: {
        this.props.updateStatement(this.props.statement)
        break
      }
      case EditStatementJustificationPageMode.CREATE_STATEMENT: {
        if (this.state.doCreateJustification) {
          const justification = consolidateBasis(this.props.justification)
          this.props.createStatementJustification(this.props.statement, justification)
        } else {
          this.props.createStatement(this.props.statement)
        }
        break
      }
      case EditStatementJustificationPageMode.CREATE_JUSTIFICATION: {
        const justification = consolidateBasis(this.props.justification)
        this.props.createStatementJustification(this.props.statement, justification)
        break
      }
      default: {
        logger.warn("onSubmit has unhandled EditStatementJustificationPageMode", this.props.mode)
      }
    }
  }

  onJustificationPropertyChange(properties) {
    this.props.editJustificationPropertyChange(this.justificationEditorId, properties)
  }

  addJustificationUrl() {
    this.props.editJustificationAddUrl(this.justificationEditorId)
  }

  deleteJustificationUrl(url, index) {
    this.props.editJustificationDeleteUrl(this.justificationEditorId, url, index)
  }

  onDoCreateJustificationSwitchClick(checked) {
    this.setState({doCreateJustification: checked})
  }

  onCancel() {
    this.props.goBack()
  }

  logPropProblems(props) {
    const {
      mode,
      statement,
    } = props
    switch (mode) {
      case EditStatementJustificationPageMode.CREATE_STATEMENT: {
        if (statement && !isNil(statement.id)) {
          logger.warn("Creating statement that has ID")
        }
        break
      }
      case EditStatementJustificationPageMode.EDIT_STATEMENT: {
        if (statement && isNil(statement.id)) {
          logger.warn("Editing statement that has no ID")
        }
        if (!props.match.params.statementId) {
          logger.warn("Editing statement but received no statement ID param")
        }
        break
      }
    }
  }

  render() {
    const {
      mode,
      statement,
      justification,
      inProgress,
      errorMessage,
    } = this.props
    const {
      doCreateJustification,
      isExpanded,
    } = this.state

    const doHideJustificationEditor = mode === EditStatementJustificationPageMode.EDIT_STATEMENT
    const doHideJustificationEditorSwitch = mode !== EditStatementJustificationPageMode.CREATE_STATEMENT

    const title = text(titleTextKeyByMode[mode])
    const submitButtonLabel = text(submitButtonLabelTextKeyByMode[mode])
    const submitButtonTitle = text(submitButtonTitleTextKeyByMode[mode])

    return (
        <DocumentTitle title={`Howdju - ${title}`}>
          <form onSubmit={this.onSubmit}>
            <div id="addStatementPage" className="md-grid">
              <div className="md-cell md-cell--12">

                <Card expanded={isExpanded} onExpanderClick={this.onExpanderClick}>
                  <CardTitle
                      title={title}
                  />
                  <CardText className={cn({
                    errorMessage: true,
                    hidden: !errorMessage
                  })}>
                    {errorMessage}
                  </CardText>
                  <CardText>
                    <StatementEditor statementTextInputId="statementText"
                                     statement={statement}
                                     suggestionsKey={suggestionKeys.createStatementPage}
                                     onPropertyChange={this.onStatementPropertyChange}
                    />
                  </CardText>

                  <Divider className={cn({hidden: doHideJustificationEditor})} />

                  <Switch id="doCreateJustificationSwitch"
                          name="doCreateJustification"
                          label={text(ADD_JUSTIFICATION_TO_CREATE_STATEMENT)}
                          className={cn({hidden: doHideJustificationEditorSwitch})}
                          checked={doCreateJustification}
                          onChange={this.onDoCreateJustificationSwitchClick} />

                  <CardText className={cn({hidden: doHideJustificationEditor || !doCreateJustification})}>
                    <JustificationEditor justification={justification}
                                         onPropertyChange={this.onJustificationPropertyChange}
                                         onAddUrlClick={this.addJustificationUrl}
                                         onDeleteUrlClick={this.deleteJustificationUrl}
                    />
                  </CardText>

                  <Divider className={cn({hidden: doHideJustificationEditor})} />

                  <CardActions>
                    <Button raised
                            primary
                            type="submit"
                            label={submitButtonLabel}
                            title={submitButtonTitle}
                            disabled={inProgress}
                    />
                    <Button flat
                            label="Cancel"
                            disabled={inProgress}
                            onClick={this.onCancel}
                    />
                  </CardActions>

                </Card>

              </div>
            </div>
          </form>
        </DocumentTitle>
    )
  }
}

export default connect(state => state.ui.editStatementJustificationPage, {
  createStatement,
  createStatementJustification,
  updateStatement,
  fetchStatementForEdit,
  editStatementPropertyChange,
  editJustificationPropertyChange,
  editJustificationAddUrl,
  editJustificationDeleteUrl,
  goBack,
})(EditStatementJustificationPage)