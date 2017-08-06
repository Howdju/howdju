import React from 'react'
import cn from 'classnames'

import './ChatBubble.scss'

export default props => {
  const {
    className,
    isPositive,
    isNegative,
    children,
    ...rest,
  } = props
  return (
      <div {...rest}
           className={cn(className, "chat-bubble", {
             'chat-bubble--positive': isPositive,
             'chat-bubble--negative': isNegative,
           })}
      >
        {children}
      </div>
  )
}
