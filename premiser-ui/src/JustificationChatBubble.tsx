import React, { HTMLAttributes, ReactNode } from "react";

import {
  ContextTrailItem,
  isRootNegative,
  isRootPositive,
  JustificationView,
} from "howdju-common";

import JustificationBasisViewer from "./JustificationBasisViewer";
import ChatBubble from "./ChatBubble";
import { ComponentId, OnClickJustificationWritQuoteUrl } from "./types";
import { OnClickWritQuoteUrl } from "./WritQuoteViewer";

import "./JustificationChatBubble.scss";

interface Props extends HTMLAttributes<HTMLDivElement> {
  id?: ComponentId;
  justification: JustificationView;
  doShowControls: boolean;
  showStatusText: boolean;
  showBasisUrls: boolean;
  menu?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  contextTrailItems?: ContextTrailItem[];
  onClickWritQuoteUrl?: OnClickJustificationWritQuoteUrl;
}

export default function JustificationChatBubble({
  id,
  justification,
  doShowControls,
  showStatusText,
  showBasisUrls,
  menu,
  actions,
  children,
  contextTrailItems,
  onClickWritQuoteUrl,
  ...rest
}: Props) {
  const _onClickWritQuoteUrl: OnClickWritQuoteUrl = (
    event,
    _writQuote,
    url
  ) => {
    if (onClickWritQuoteUrl) {
      onClickWritQuoteUrl(event, justification, url);
    }
  };

  const _isRootPositive = isRootPositive(justification);
  const _isRootNegative = isRootNegative(justification);

  const basisViewerIdPrefix = id ? id + "-" : "";
  const basisViewerId = `${basisViewerIdPrefix}basis-viewer`;

  return (
    <ChatBubble
      {...rest}
      isPositive={_isRootPositive}
      isNegative={_isRootNegative}
    >
      <div className="justification-basis-viewer-row">
        <JustificationBasisViewer
          id={basisViewerId}
          justification={justification}
          showStatusText={showStatusText}
          showUrls={showBasisUrls}
          contextTrailItems={contextTrailItems}
          onClickWritQuoteUrl={_onClickWritQuoteUrl}
        />
        {doShowControls && menu}
      </div>
      {doShowControls && actions}
      {children}
    </ChatBubble>
  );
}
