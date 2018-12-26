import React from 'react'
import uuidv4 from 'uuid/v4'

import {logger} from './logger'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorCorrelationId: uuidv4(),
    }
  }

  componentDidCatch(error, info) {
    const errorMessage = error.toString()
    const {componentStack} = info
    logger.error(errorMessage, componentStack, {error, info, errorCorrelationId: this.state.errorCorrelationId})
  }

  render() {
    if (this.state.hasError) {
      return (
        <div>
          <h2>Something went wrong.</h2>
          <p>
            Please let us know what happened.
            Please reference Error ID {this.state.errorCorrelationId} when you contact us.
          </p>
        </div>
      )
    }
    return this.props.children
  }
}