import cn from 'classnames'
import React from 'react'
import {SelectionControlGroup as ReactMdSelectionControlGroup} from 'react-md'

import './SelectionControlGroup.scss'

export default class SelectionControlGroup extends React.Component {
  render() {
    const {
      error,
      errorText,
      ...rest
    } = this.props

    return (
      <div className={cn({error})}>
        <ReactMdSelectionControlGroup error={error ? 'error' : undefined} {...rest} />
        {errorText && (
          <div className="error-message">
            {errorText}
          </div>
        )}
      </div>
    )
  }
}