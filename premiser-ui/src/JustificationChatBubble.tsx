import React, { HTMLAttributes, ReactNode } from "react";

import {
  ContextTrailItem,
  isRootNegative,
  isRootPositive,
  JustificationOut,
} from "howdju-common";
import JustificationBasisViewer from "./JustificationBasisViewer";
import ChatBubble from "./ChatBubble";

import "./JustificationChatBubble.scss";
import { ComponentId, OnClickJustificationWritQuoteUrl } from "./types";
import { OnClickWritQuoteUrl } from "./WritQuoteViewer";

interface Props extends HTMLAttributes<HTMLDivElement> {
  id?: ComponentId;
  className?: string;
  justification: JustificationOut;
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
  className,
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
  const _onClickWritQuoteUrl: OnClickWritQuoteUrl = (event, writQuote, url) => {
    if (onClickWritQuoteUrl) {
      onClickWritQuoteUrl(event, justification, writQuote, url);
    }
  };

  const _isRootPositive = isRootPositive(justification);
  const _isRootNegative = isRootNegative(justification);

  const basisViewerIdPrefix = id ? id + "-" : "";
  const basisViewerId = `${basisViewerIdPrefix}basis-viewer`;

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
