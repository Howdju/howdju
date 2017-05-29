import React from 'react'

export default props => {
  const {
    statement
  } = props
  return (
      <span>{statement.text}</span>
  )
}