import React, {Component} from 'react'
import {Button, Card, CardActions, CardText, CardTitle, FocusContainer, SelectField} from 'react-md'
import SingleLineTextField from './SingleLineTextField'
import * as sentry from './sentry'
import {Severity} from '@sentry/types'

const LEVELS = [{
  label: 'Fatal',
  value: Severity.Fatal,
}, {
  label: 'Critical',
  value: Severity.Critical,
}, {
  label: 'Error',
  value: Severity.Error,
}, {
  label: 'Warning',
  value: Severity.Warning,
}, {
  label: 'Debug',
  value: Severity.Debug,
}]

class TestErrorPage extends Component {

  constructor(props) {
    super(props)
    this.state = {message: '', level: Severity.Error}
  }

  onMessageChange = properties => {
    this.setState(state => ({...state, message: properties.message}))
  }

  onLevelChange = value => {
    this.setState(state => ({...state, level: value}))
  }

  onCreateMessage = (event) => {
    event.preventDefault()
    sentry.captureMessage(`Test message: ${this.state.message}`, this.state.level)
  }

  onCreateError = (event) => {
    event.preventDefault()
    throw new Error(`Test error: ${this.state.message}`)
  }

  render () {
    const {
      message,
      level,
    } = this.state
    return (
      <Card>
        <CardTitle title="Test error"/>
        <form onSubmit={this.onSubmit}>
          <FocusContainer focusOnMount containFocus={false}>

            <CardText>
              <SingleLineTextField
                name="message"
                value={message}
                required
                onPropertyChange={this.onMessageChange}
              />
              <SelectField
                label="Level"
                value={level}
                onChange={this.onLevelChange}
                menuItems={LEVELS}
              />
            </CardText>
            <CardActions>
              <Button raised
                      children="Create test error"
                      disabled={!message}
                      onClick={this.onCreateError}
              />
              <Button raised
                      children="Create test message"
                      disabled={!message}
                      onClick={this.onCreateMessage}
              />
            </CardActions>

          </FocusContainer>
        </form>
      </Card>
    )
  }
}
export default TestErrorPage