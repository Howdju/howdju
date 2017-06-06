import React from 'react'
import CircularProgress from "react-md/lib/Progress/CircularProgress";

export default props => {
  const {
    id,
    statement,
    isFetching,
  } = props
  return (
      <span>
        {statement ?
            statement.text :
            isFetching ?
                <CircularProgress /> :
                ''
        }
      </span>
  )
}