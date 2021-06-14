import React from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'

export default class AccountSettingsViewer extends React.Component {

  static propTypes = {
    accountSettings: PropTypes.object,
  }

  render() {
    const {
      id,
      accountSettings,
      className,
      showStatusText,
      ...rest
    } = this.props

    return (
      <div
        {...rest}
        id={id}
        className={cn(className, "persorg-viewer")}
      >
        {accountSettings && (
          <>
            <h2>Paid contributions disclosure</h2>
            <p>
              {accountSettings.paidContributionsDisclosure || <em>None</em>}
            </p>
          </>
        )}
      </div>
    )
  }
}
