import React, {Component} from 'react'
import PropTypes from 'prop-types'
import CircularProgress from 'react-md/lib/Progress/CircularProgress'
import Button from 'react-md/lib/Buttons/Button'

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
              label={fetchLabel}
      />
    )
  }
}
FetchButton.propTypes = {
  /** The ID of the progress indicator.  Required for accessibility. */
  progressId: PropTypes.string.isRequired
}