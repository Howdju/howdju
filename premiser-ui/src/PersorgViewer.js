import React from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'

export default class PersorgViewer extends React.Component {

  static propTypes = {
    persorg: PropTypes.object,
  }

  render() {
    const {
      id,
      persorg,
      className,
      showStatusText,
      ...rest,
    } = this.props

    return (
      <div
        {...rest}
        id={id}
        className={cn(className, "persorg-viewer")}
      >
        {persorg && (
          <div className="persorg-viewer">
            <div className="persorg-name">
              {persorg.name}
            </div>
          </div>
        )}
      </div>
    )
  }
}
