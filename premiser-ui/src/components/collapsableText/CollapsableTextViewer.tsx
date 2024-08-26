import React, { useState, HTMLAttributes } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import cn from "classnames";

import { truncateText } from "@/viewModels";
import TextButton from "../button/TextButton";

import "./CollapsableTextViewer.scss";

interface Props extends HTMLAttributes<HTMLDivElement> {
  text: string | undefined;
  /** If text is longer than this it will be truncated when collapsed. */
  truncateLength?: number;
}

export default function CollapsableTextViewer({
  text,
  truncateLength = 256,
  className,
  ...rest
}: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isTextLong = (text?.length ?? 0) > truncateLength;
  const truncatedText =
    !isTextLong || isExpanded
      ? text
      : truncateText(text, { omission: "", length: truncateLength });

  const expandEllipsis = (
    <span
      className="collapsible-text-ellipsis clickable"
      onClick={() => setIsExpanded(true)}
    >
      …
    </span>
  );

  return (
    <div className={cn("collapsible-text-viewer", className)} {...rest}>
      <Markdown remarkPlugins={[remarkGfm]}>{truncatedText || ""}</Markdown>
      {isTextLong && !isExpanded && (
        <>
          {expandEllipsis}
          <TextButton
            className="text-expand-toggle"
            onClick={() => setIsExpanded(true)}
          >
            More
          </TextButton>
        </>
      )}
      {isTextLong && isExpanded && (
        <TextButton
          className="text-expand-toggle"
          onClick={() => setIsExpanded(false)}
        >
          Less
        </TextButton>
      )}
    </div>
  );
}
