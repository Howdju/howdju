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

import {
  createStatement,
  updateStatement,
  fetchStatement,
  editStatementPropertyChange,
  editJustificationPropertyChange,
  editJustificationAddUrl,
  editJustificationDeleteUrl,
  fetchStatementForEdit,
} from './actions'
import text, {
  ADD_JUSTIFICATION_TO_CREATE_STATEMENT,
  CREATE_STATEMENT_FAILURE_MESSAGE,
  CREATE_STATEMENT_SUBMIT_BUTTON_LABEL,
  CREATE_STATEMENT_SUBMIT_BUTTON_TITLE,
  EDIT_STATEMENT_SUBMIT_BUTTON_LABEL,
  EDIT_STATEMENT_SUBMIT_BUTTON_TITLE,
} from "./texts";
import { suggestionKeys } from './autocompleter'
import JustificationEditor from './JustificationEditor'
import {consolidateBasis} from "./models";
import { editStatementPageStatementEditorId, editStatementPageJustificationEditorId } from "./editorIds";
import StatementEditor from "./StatementEditor";
import {goBack} from "react-router-redux";

class EditStatementPage extends Component {

  constructor() {
    super()

    this.state = {
      doShowCreateJustificationSwitch: false,
      doCreateJustification: false,
    }

    this.onStatementPropertyChange = this.onStatementPropertyChange.bind(this)

    this.onDoCreateJustificationSwitchClick = this.onDoCreateJustificationSwitchClick.bind(this)

    this.onNewJustificationPropertyChange = this.onNewJustificationPropertyChange.bind(this)
    this.addNewJustificationUrl = this.addNewJustificationUrl.bind(this)
    this.deleteNewJustificationUrl = this.deleteNewJustificationUrl.bind(this)

    this.onSubmit = this.onSubmit.bind(this)
    this.onCancel = this.onCancel.bind(this)

    this.statementEditorId = editStatementPageStatementEditorId
    this.justificationEditorId = editStatementPageJustificationEditorId
  }

  componentWillMount() {
    const statementId = this.props.match.params.statementId
    if (statementId) {
      this.props.fetchStatementForEdit(statementId)
    }
  }

  onStatementPropertyChange(val, e) {
    const name = e.target.name
    this.props.editStatementPropertyChange(this.statementEditorId, {[name]: val})
  }

  onSubmit(event) {
    event.preventDefault()
    if (this.isEdit()) {
      this.props.updateStatement(this.props.statement)
    } else {
      if (this.state.doCreateJustification) {
        const newJustification = consolidateBasis(this.props.newJustification)
        this.props.createStatement(this.props.statement, newJustification)
      } else {
        this.props.createStatement(this.props.statement)
      }
    }
  }

  onNewJustificationPropertyChange(properties) {
    this.props.editJustificationPropertyChange(this.justificationEditorId, properties)
  }

  addNewJustificationUrl() {
    this.props.editJustificationAddUrl(this.justificationEditorId)
  }

  deleteNewJustificationUrl(url, index) {
    this.props.editJustificationDeleteUrl(this.justificationEditorId, url, index)
  }

  onDoCreateJustificationSwitchClick(checked) {
    this.setState({doCreateJustification: checked})
  }

  isEdit() {
    // return !!this.props.statement.id
    return !!this.statementId()
  }

  statementId() {
    return this.props.match.params.statementId
  }

  onCancel() {
    this.props.goBack()
  }

  render() {
    const {
      statement,
      newJustification,
      inProgress,
      errorMessage,
    } = this.props
    const {
      doCreateJustification
    } = this.state

    const isEdit = this.isEdit()

    const title = isEdit ? "Edit statement" : "Create Statement"
    const submitButtonLabel = text(isEdit ? EDIT_STATEMENT_SUBMIT_BUTTON_LABEL : CREATE_STATEMENT_SUBMIT_BUTTON_LABEL)
    const submitButtonTitle = text(isEdit ? EDIT_STATEMENT_SUBMIT_BUTTON_TITLE : CREATE_STATEMENT_SUBMIT_BUTTON_TITLE)

    const isExpanded = this.state.isExpanded

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

                  <Divider className={cn({hidden: isEdit})} />

                  <Switch id="doCreateJustificationSwitch"
                          name="doCreateJustification"
                          label={text(ADD_JUSTIFICATION_TO_CREATE_STATEMENT)}
                          className={cn({hidden: isEdit})}
                          checked={doCreateJustification}
                          onChange={this.onDoCreateJustificationSwitchClick} />

                  <CardText className={cn({hidden: isEdit || !doCreateJustification})}>
                    <JustificationEditor justification={newJustification}
                                         onPropertyChange={this.onNewJustificationPropertyChange}
                                         onAddUrlClick={this.addNewJustificationUrl}
                                         onDeleteUrlClick={this.deleteNewJustificationUrl}
                    />
                  </CardText>

                  <Divider className={cn({hidden: isEdit})} />

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

export default connect(state => state.ui.editStatementPage, {
  createStatement,
  updateStatement,
  fetchStatementForEdit,
  editStatementPropertyChange,
  editJustificationPropertyChange,
  editJustificationAddUrl,
  editJustificationDeleteUrl,
  goBack,
})(EditStatementPage)