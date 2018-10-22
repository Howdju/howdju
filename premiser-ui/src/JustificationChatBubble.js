import React from 'react'

import {
  isRootNegative,
  isRootPositive
} from 'howdju-common'
import JustificationBasisViewer from './JustificationBasisViewer'
import ChatBubble from './ChatBubble'

import './JustificationChatBubble.scss'

export default function JustificationChatBubble(props) {
  const {
    id,
    className,
    justification,
    writQuoteEditorId,
    doShowControls,
    doShowBasisJustifications,
    showStatusText,
    isCondensed,
    isUnCondensed,
    showBasisUrls,
    menu,
    actions,
    children,
    trailPropositions,
    ...rest,
  } = props
  const _isRootPositive = isRootPositive(justification)
  const _isRootNegative = isRootNegative(justification)

  const basisViewerIdPrefix = id ? id + '-' : ''
  const basisViewerId = `${basisViewerIdPrefix}basis-viewer`

  return (
    <ChatBubble
      {...rest}
      className={className}
      isPositive={_isRootPositive}
      isNegative={_isRootNegative}
    >
      <div className="justification-basis-viewer-row">
        <JustificationBasisViewer
          id={basisViewerId}
          justification={justification}
          writQuoteEditorId={writQuoteEditorId}
          doShowControls={doShowControls}
          doShowBasisJustifications={doShowBasisJustifications}
          isCondensed={isCondensed}
          isUnCondensed={isUnCondensed}
          showStatusText={showStatusText}
          showUrls={showBasisUrls}
          trailPropositions={trailPropositions}
        />
        {doShowControls && menu}
      </div>
      {doShowControls && actions}
      {children}
    </ChatBubble>
  )
}
