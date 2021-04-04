import React, {Component} from 'react'
import {Button, Card, CardActions, CardText, CardTitle, FocusContainer} from 'react-md'
import SingleLineTextField from './SingleLineTextField'
import * as sentry from './sentry'

class TestErrorPage extends Component {

  constructor(props) {
    super(props)
    this.state = {message: ''}
  }

  onPropertyChange = (properties) => {
    this.setState(() => ({message: properties.message}))
  }

  onSubmit = (event) => {
    event.preventDefault()
    sentry.captureMessage(`Test error: ${this.state.message}`)
  }

  render () {
    const {
      message
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
                onPropertyChange={this.onPropertyChange}
                onSubmit={this.onSubmit}
              />
            </CardText>
            <CardActions>
              <Button raised
                      primary
                      type="submit"
                      children="Create test error"
                      disabled={!message}
              />
            </CardActions>

          </FocusContainer>
        </form>
      </Card>
    )
  }
}
export default TestErrorPage
