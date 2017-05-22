import React, {Component} from "react"
import Button from 'react-md/lib/Buttons'
import { connect } from 'react-redux'
import Card from 'react-md/lib/Cards'
import CardTitle from 'react-md/lib/Cards/CardTitle';
import CardActions from 'react-md/lib/Cards/CardActions';
import CardText from 'react-md/lib/Cards/CardText';
import classNames from 'classnames'
import FontIcon from 'react-md/lib/FontIcons'
import Divider from 'react-md/lib/Dividers'
import { Switch } from 'react-md/lib/SelectionControls'

import {
  createStatementPropertyChange, createStatement, newJustificationPropertyChange, addNewJustificationUrl,
  deleteNewJustificationUrl
} from './actions'
import text, {
  ADD_JUSTIFICATION_TO_CREATE_STATEMENT,
  CREATE_STATEMENT_FAILURE_MESSAGE,
  CREATE_STATEMENT_SUBMIT_BUTTON_LABEL,
  CREATE_STATEMENT_SUBMIT_BUTTON_TITLE,
} from "./texts";
import { suggestionKeys } from './autocompleter'
import StatementTextAutocomplete from './StatementTextAutocomplete'
import JustificationEditor from './JustificationEditor'
import {consolidateBasis} from "./models";
import {createStatementPageJustificationEditorId} from "./editorIds";
import StatementEditor from "./StatementEditor";

class CreateStatementPage extends Component {

  constructor() {
    super()

    this.state = {doCreateJustification: false}

    this.onNewStatementPropertyChange = this.onNewStatementPropertyChange.bind(this)

    this.onDoCreateJustificationSwitchClick = this.onDoCreateJustificationSwitchClick.bind(this)

    this.onNewJustificationPropertyChange = this.onNewJustificationPropertyChange.bind(this)
    this.addNewJustificationUrl = this.addNewJustificationUrl.bind(this)
    this.deleteNewJustificationUrl = this.deleteNewJustificationUrl.bind(this)

    this.onSubmit = this.onSubmit.bind(this)
  }

  onNewStatementPropertyChange(val, e) {
    const name = e.target.name
    this.props.createStatementPropertyChange({[name]: val})
  }

  onSubmit(event) {
    event.preventDefault()
    if (this.state.doCreateJustification) {
      const newJustification = consolidateBasis(this.props.newJustification)
      this.props.createStatement(this.props.newStatement, newJustification)
    } else {
      this.props.createStatement(this.props.newStatement)
    }
  }

  onNewJustificationPropertyChange(properties) {
    this.props.newJustificationPropertyChange(createStatementPageJustificationEditorId, properties)
  }

  addNewJustificationUrl() {
    this.props.addNewJustificationUrl(this.justificationEditorId)
  }

  deleteNewJustificationUrl(url, index) {
    this.props.deleteNewJustificationUrl(createStatementPageJustificationEditorId, url, index)
  }

  onDoCreateJustificationSwitchClick(checked) {
    this.setState({doCreateJustification: checked})
  }

  render() {
    const {
      newStatement,
      newJustification,
      isCreating,
      didFail,
    } = this.props
    const {
      doCreateJustification
    } = this.state

    const errorMessage = didFail ? text(CREATE_STATEMENT_FAILURE_MESSAGE) : ''

    const isExpanded = this.state.isExpanded

    return (
      <form onSubmit={this.onSubmit}>
        <div id="addStatementPage" className="md-grid">
          <div className="md-cell md-cell--12">

            <Card expanded={isExpanded} onExpanderClick={this.onExpanderClick}>
              <CardTitle
                  title="Create Statement"
              />
              <CardText className={classNames({
                errorMessage: true,
                hidden: !didFail
              })}>
                {errorMessage}
              </CardText>
              <CardText>
                <StatementEditor statementTextInputId="statementText"
                                 statement={newStatement}
                                 suggestionsKey={suggestionKeys.createStatementPage}
                                 onPropertyChange={this.onNewStatementPropertyChange}
                />
              </CardText>

              <Divider />

              <Switch id="doCreateJustificationSwitch"
                      name="doCreateJustification"
                      label={text(ADD_JUSTIFICATION_TO_CREATE_STATEMENT)}
                      checked={doCreateJustification}
                      onChange={this.onDoCreateJustificationSwitchClick} />

              <CardText className={classNames({hidden: !doCreateJustification})}>
                <JustificationEditor justification={newJustification}
                                     onPropertyChange={this.onNewJustificationPropertyChange}
                                     onAddUrlClick={this.addNewJustificationUrl}
                                     onDeleteUrlClick={this.deleteNewJustificationUrl}
                />
              </CardText>

              <Divider />

              <CardActions>
                <Button raised
                        primary
                        type="submit"
                        label={text(CREATE_STATEMENT_SUBMIT_BUTTON_LABEL)}
                        title={text(CREATE_STATEMENT_SUBMIT_BUTTON_TITLE)}
                        disabled={isCreating}
                />
              </CardActions>

            </Card>

          </div>
        </div>
      </form>
    )
  }
}

export default connect(state => state.ui.createStatementPage, {
  createStatement,
  createStatementPropertyChange,
  newJustificationPropertyChange,
  addNewJustificationUrl,
  deleteNewJustificationUrl,
})(CreateStatementPage)