import React, { useState, HTMLAttributes } from "react";

import { truncateText } from "@/viewModels";
import TextButton from "../button/TextButton";

import "./CollapsableTextViewer.scss";

// two or more line breaks will indicate a paragraph
const paragraphBreak = /(\r\n|\n|\r){2,}/g;
const onlyWhitespace = /^\s*$/;

interface Props extends HTMLAttributes<HTMLDivElement> {
  text: string | undefined;
  /** If text is longer than this it will be truncated when collapsed. */
  truncateLength?: number;
}

export default function CollapsableTextViewer({
  text,
  truncateLength = 256,
  ...rest
}: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isTextLong = (text?.length ?? 0) > truncateLength;
  const displayText =
    !isTextLong || isExpanded
      ? text
      : truncateText(text, { omission: "", length: truncateLength });
  const paragraphs = makeParagraphs(displayText);

  const expandEllipsis = (
    <span
      className="collapsible-text-ellipsis clickable"
      onClick={() => setIsExpanded(true)}
    >
      …
    </span>
  );

  return (
    <div {...rest}>
      <div>
        {paragraphs?.map((para, i) => {
          const key = `quote-text-para-${i}`;
          if (isTextLong && !isExpanded && i === paragraphs.length - 1) {
            return (
              <p key={key}>
                {para} {expandEllipsis}
              </p>
            );
          }
          return <p key={key}>{para}</p>;
        })}
      </div>
      {isTextLong && !isExpanded && (
        <TextButton
          className="text-expand-toggle"
          onClick={() => setIsExpanded(true)}
        >
          More
        </TextButton>
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

function makeParagraphs(quote: string | undefined) {
  return quote
    ?.split(paragraphBreak)
    .filter((para) => !onlyWhitespace.test(para));
}
