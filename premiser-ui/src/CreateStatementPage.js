import React, {Component} from "react"
import Button from 'react-md/lib/Buttons'
import { connect } from 'react-redux'
import Paper from 'react-md/lib/Papers'
import classNames from 'classnames'
import FontIcon from 'react-md/lib/FontIcons'

import {
  createStatementPropertyChange, createStatement
} from './actions'
import text, {
  CREATE_STATEMENT_FAILURE_MESSAGE,
  CREATE_STATEMENT_SUBMIT_BUTTON_LABEL,
  CREATE_STATEMENT_SUBMIT_BUTTON_TITLE
} from "./texts";
import { suggestionKeys } from './autocompleter'
import StatementTextAutocomplete from './StatementTextAutocomplete'

class CreateStatementPage extends Component {

  constructor() {
    super()
    this.onPropertyChange = this.onPropertyChange.bind(this)
    this.onSubmit = this.onSubmit.bind(this)
    this.onTextAutocomplete = this.onTextAutocomplete.bind(this)
  }

  onPropertyChange(val, e) {
    const name = e.target.name
    this.props.createStatementPropertyChange({[name]: val})
  }

  onSubmit(event) {
    event.preventDefault()
    this.props.createStatement(this.props.statement)
  }

  onTextAutocomplete(text, index) {
    this.props.createStatementPropertyChange({text})
  }

  render() {
    const {
      statement,
      isCreating,
      didFail,
      textAutocompleteResults,
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

                <form onSubmit={this.onSubmit}>

                  <StatementTextAutocomplete
                      id="statementText"
                      name="text"
                      label="Text"
                      required
                      leftIcon={<FontIcon>text_fields</FontIcon>}
                      value={statement.text}
                      suggestionsKey={suggestionKeys.createStatementPage}
                      onChange={this.onPropertyChange}
                      onAutocomplete={this.onTextAutocomplete}
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