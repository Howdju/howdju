import React from 'react'
import {Link} from 'react-router-dom'
import CircularProgress from "react-md/lib/Progress/CircularProgress"
import cn from 'classnames'

import paths from './paths'

const StatementViewer = props => {
  const {
    id,
    statement,
    isFetching,
    className,
    ...rest,
  } = props
  return (
    <span
      {...rest}
      id={id}
      className={cn(className, "statement-viewer")}
    >
      {statement ?
        <Link to={paths.statement(statement)}>
          {statement.text}
        </Link> :
        isFetching ?
          <CircularProgress /> :
          ''
      }
    </span>
  )
}
export default StatementViewer
