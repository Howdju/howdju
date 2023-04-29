import React, { MouseEvent, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "react-md";
import filter from "lodash/filter";
import map from "lodash/map";
import split from "lodash/split";
import cn from "classnames";
import moment from "moment";

import { extractDomain, UrlOut, WritQuoteOut } from "howdju-common";

import { truncateWritQuoteText, isTextLong } from "./viewModels";
import * as characters from "./characters";
import t from "./texts";
import config from "./config";
import paths from "./paths";

import "./WritQuoteViewer.scss";

export type OnClickWritQuoteUrl = (
  event: MouseEvent,
  writQuote: WritQuoteOut,
  url: UrlOut
) => void;

interface Props {
  writQuote: WritQuoteOut;
  className?: string;
  showUrls?: boolean;
  showStatusText?: boolean;
  onClickUrl?: OnClickWritQuoteUrl;
}

export default function WritQuoteViewer({
  writQuote,
  className,
  showUrls = true,
  showStatusText = true,
  onClickUrl,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  function _onClickUrl(event: MouseEvent, url: UrlOut) {
    if (onClickUrl) {
      onClickUrl(event, writQuote, url);
    }
  }

  const urls = map(writQuote.urls, (u) => {
    const id = `url-${u.id}-list-item`;
    return (
      <li id={id} key={id} className="url">
        <a href={u.url} onClick={(event) => _onClickUrl(event, u)}>
          {extractDomain(u.url)}
        </a>
      </li>
    );
  });

  const age = writQuote.created ? moment(writQuote.created).fromNow() : "";
  const created = writQuote.created
    ? moment(writQuote.created).format(config.humanDateTimeFormat)
    : "";

  const _isQuoteTextLong = isTextLong(writQuote.quoteText);
  const hasQuote = !!writQuote.quoteText;
  const quoteText =
    !_isQuoteTextLong || isExpanded
      ? writQuote.quoteText
      : truncateWritQuoteText(writQuote.quoteText, { omission: "" });
  const quoteTextParagraphs = makeQuoteParagraphs(quoteText);

  const expandEllipsis = (
    <span
      className="quote-text-expand-ellipsis clickable"
      onClick={() => setIsExpanded(true)}
    >
      {characters.ellipsis}
    </span>
  );

  return (
    <div className={cn(className, "writ-quote-viewer")}>
      {writQuote && (
        <div>
          <div
            className={cn("quote", {
              hidden: !hasQuote,
            })}
          >
            <div className="quote-text">
              {map(quoteTextParagraphs, (para, i) => {
                const key = `quote-text-para-${i}`;
                if (
                  _isQuoteTextLong &&
                  !isExpanded &&
                  i === quoteTextParagraphs.length - 1
                ) {
                  return (
                    <p key={key}>
                      {para} {expandEllipsis}
                    </p>
                  );
                }
                return <p key={key}>{para}</p>;
              })}
              {}
            </div>
            {_isQuoteTextLong && !isExpanded && (
              <Button
                flat
                children={t("More")}
                className="text-expand-toggle"
                onClick={() => setIsExpanded(true)}
              />
            )}
            {_isQuoteTextLong && isExpanded && (
              <Button
                flat
                children={t("Less")}
                className="text-expand-toggle"
                onClick={() => setIsExpanded(false)}
              />
            )}
          </div>
          <div className="writ-title">
            <Link to={paths.writQuoteUsages(writQuote)}>
              {writQuote.writ.title}
            </Link>
          </div>

          {showStatusText && (
            <div className="entity-status-text">
              created <span title={created}>{age}</span>
            </div>
          )}

          {showUrls && <ul className="writ-quote-urls">{urls}</ul>}
        </div>
      )}
    </div>
  );
}

function makeQuoteParagraphs(quoteText: string) {
  // two or more line breaks will indicate a paragraph
  const paragraphBreak = /(\r\n|\n|\r){2,}/g;
  const paragraphs = split(quoteText, paragraphBreak);
  const nonEmptyParagraphs = filter(paragraphs, (para) => !/^\s*$/.test(para));
  return nonEmptyParagraphs;
}
