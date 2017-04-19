import React, {Component} from "react"
import TextField from 'react-md/lib/TextFields'
import Button from 'react-md/lib/Buttons'
import {createStatementPropertyChange, createStatement} from './actions'
import { connect } from 'react-redux'
import Paper from 'react-md/lib/Papers'
import text, {
  CREATE_STATEMENT_FAILURE_MESSAGE,
  CREATE_STATEMENT_SUBMIT_BUTTON_LABEL,
  CREATE_STATEMENT_SUBMIT_BUTTON_TITLE
} from "./texts";
import classNames from 'classnames'

class CreateStatementPage extends Component {

  constructor() {
    super()
    this.handleInputChange = this.handleInputChange.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
  }

  handleInputChange(val, e) {
    const name = e.target.name
    this.props.createStatementPropertyChange({[name]: val})
  }

  handleSubmit(event) {
    event.preventDefault()
    this.props.createStatement(this.props.statement)
  }

  render() {
    const {
      statement,
      isCreating,
      didFail,
    } = this.props

    const errorMessage = didFail ? text(CREATE_STATEMENT_FAILURE_MESSAGE) : ''

    return (
      <div id="addStatementPage" className="md-grid">
        <div className="md-cell md-cell--12">

          <Paper zDepth={2}>

            <div className="md-grid">

              <div className={classNames({
                'md-cell': true,
                'md-cell--12': true,
                errorMessage: true,
                hidden: !didFail
              })}>
                {errorMessage}
              </div>

              <div className="md-cell md-cell--12">

                <form onSubmit={this.handleSubmit}>
                  <TextField
                      id="statementText"
                      type="text"
                      name="text"
                      label="Text"
                      value={statement.text}
                      required
                      maxLength={2048}
                      pattern=".+"
                      onChange={this.handleInputChange}
                  />

                  <Button raised
                          primary
                          type="submit"
                          label={text(CREATE_STATEMENT_SUBMIT_BUTTON_LABEL)}
                          title={text(CREATE_STATEMENT_SUBMIT_BUTTON_TITLE)}
                          disabled={isCreating}
                  />
                </form>

              </div>
            </div>

          </Paper>
        </div>
      </div>
    )
  }
}

export default connect(state => state.ui.createStatementPage, {
  createStatement,
  createStatementPropertyChange,
})(CreateStatementPage)