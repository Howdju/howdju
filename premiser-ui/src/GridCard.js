import React from 'react'
import cn from 'classnames'
import Card from "react-md/lib/Cards/Card";

export default props => {
  const {
    cellClass,
    cellClasses,
    actions,
    children,
    ...rest,
  } = props

  return (

      <Card {...rest}>

        <div className="md-grid">
          <div className={cn(`md-cell md-cell--12 ${cellClass}`, cellClasses)}>

            {children}

          </div>
        </div>

        {actions}

      </Card>
  )
}