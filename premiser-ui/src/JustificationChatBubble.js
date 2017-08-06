import React from 'react'
import cn from 'classnames'

import {isRootNegative, isRootPositive} from './models'
import JustificationBasisViewer from './JustificationBasisViewer'
import ChatBubble from './ChatBubble'

import './JustificationChatBubble.scss'

export default props => {
  const {
    className,
    justification,
    doShowControls,
    doShowBasisJustifications,
    ...rest,
  } = props
  const _isRootPositive = isRootPositive(justification)
  const _isRootNegative = isRootNegative(justification)

  const id = `justification-chat-bubble-justification-basis-viewer-${justification.id}`

  return (
      <ChatBubble {...rest}
                  className={cn(className, "md-grid")}
                  isPositive={_isRootPositive}
                  isNegative={_isRootNegative}
      >
        <JustificationBasisViewer id={id}
                                  className="md-cell md-cell--12"
                                  justification={justification}
                                  doShowControls={doShowControls}
                                  doShowBasisJustifications={doShowBasisJustifications}
        />
      </ChatBubble>
  )
}
