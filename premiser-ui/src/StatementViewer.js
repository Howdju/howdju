import React from 'react'
import {Link} from 'react-router-dom'
import CircularProgress from "react-md/lib/Progress/CircularProgress"

import paths from './paths'

const StatementViewer = props => {
  const {
    id,
    statement,
    isFetching,
  } = props
  return (
    <span id={id}
          className="statement-viewer"
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
