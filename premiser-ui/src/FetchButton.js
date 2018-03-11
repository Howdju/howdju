import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {CircularProgress, Button} from 'react-md'

import './FetchButton.scss'

export default class FetchButton extends Component {
  render() {
    const {
      isFetching,
      label,
      progressId,
      ...rest
    } = this.props
    const fetchingLabel = (
      <div>
        {label}
        <CircularProgress key={progressId} id={progressId} />
      </div>
    )
    const fetchLabel = isFetching ? fetchingLabel : label
    return (
      <Button {...rest}
              children={fetchLabel}
      />
    )
  }
}
FetchButton.propTypes = {
  /** The ID of the progress indicator.  Required for accessibility. */
  progressId: PropTypes.string.isRequired
}