import React from 'react'
import PropTypes from 'prop-types'
import {Link} from 'react-router-dom'
import cn from 'classnames'
import moment from 'moment'
import get from 'lodash/get'

import paths from './paths'
import config from './config'
import JustificationCountViewer from './JustificationCountViewer'

export default class StatementViewer extends React.Component {

  static propTypes = {
    statement: PropTypes.object,
  }

  static defaultprops = {
    showStatusText: true,
    showJustificationCount: true,
  }

  render() {
    const {
      id,
      statement,
      className,
      showStatusText,
      contextTrailItems,
      showJustificationCount,
      ...rest,
    } = this.props

    const age = statement.created ? moment(statement.created).fromNow() : ''
    const created = statement.created ? moment(statement.created).format(config.humanDateTimeFormat) : ''
    const creatorName = get(statement, 'creator.longName')
    const creatorNameDescription = creatorName && ` by ${creatorName}` || ''

    return (
      <div
        {...rest}
        id={id}
        className={cn(className, "statement-viewer")}
      >
        {statement && (
          <div className="statement-viewer">
            <div className="statement-text">
              <Link to={paths.statement(statement, contextTrailItems)}>
                Statement
                {statement.rootProposition.text}
                {' '}
                {showJustificationCount && statement.rootJustificationCountByPolarity && (
                  <JustificationCountViewer justificationCountByPolarity={statement.rootJustificationCountByPolarity}/>
                )}
              </Link>
            </div>
            {showStatusText && (
              <div>
                <span className="entity-status-text">
                  created{creatorNameDescription} <span title={created}>{age}</span>
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }
}