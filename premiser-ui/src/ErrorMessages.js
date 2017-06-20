import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {toErrorMessage} from './modelErrorMessages'

class ErrorMessages extends Component {
  render() {
    const {
      errors
    } = this.props

    const errorList = (
        <ul className="errorMessage">
          {errors && errors.map(error => <li key={error}>{toErrorMessage(error)}</li>)}
        </ul>
    )
    return (
        errors && errors.length > 0 ? errorList : null
    )
  }
}
ErrorMessages.propTypes = {
  errors: PropTypes.array
}

export default ErrorMessages