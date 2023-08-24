import React from "react";
import { MaterialSymbol } from "react-material-symbols";
import { Moment } from "moment";

import {
  MediaExcerptView,
  toUrlWithFragmentFromAnchors,
  toUrlWithFragmentFromQuotation,
  UrlLocatorView,
} from "howdju-common";

import CollapsibleTextViewer from "@/components/collapsableText/CollapsableTextViewer";
import MediaExcerptCitationViewer from "./MediaExcerptCitationViewer";
import paths from "@/paths";
import Link from "@/Link";
import CreationInfo from "../creationInfo/CreationInfo";
import config from "../../config";

import "./MediaExcerptViewer.scss";
import { useAppDispatch } from "@/hooks";
import { makeExtensionHighlightOnClickUrlLocatorCallback } from "@/extensionCallbacks";
import { OnClickUrlLocator } from "@/types";

interface Props {
  id: string;
  mediaExcerpt: MediaExcerptView;
}

export default function MediaExcerptViewer({ mediaExcerpt }: Props) {
  const dispatch = useAppDispatch();
  const onClickUrlLocator =
    makeExtensionHighlightOnClickUrlLocatorCallback(dispatch);
  return (
    <div>
      <CollapsibleTextViewer
        className="quotation"
        text={mediaExcerpt.localRep.quotation}
      />
      <CreationInfo
        created={mediaExcerpt.created}
        creator={mediaExcerpt.creator}
      />
      <ul className="url-locators">
        {mediaExcerpt.locators.urlLocators.map((urlLocator: UrlLocatorView) => (
          <li key={urlLocator.key} className="url">
            {toAnchorElement(mediaExcerpt, urlLocator, onClickUrlLocator)}
          </li>
        ))}
      </ul>
      <ul className="citations">
        {mediaExcerpt.citations.map((citation) => (
          <li key={citation.key} className="citation">
            <MediaExcerptCitationViewer citation={citation} />
          </li>
        ))}
      </ul>
      <ul className="speakers">
        {mediaExcerpt.speakers.map(({ persorg }) => (
          <li key={persorg.key} className="speaker">
            <Link to={paths.persorg(persorg)}>{persorg.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function toAnchorElement(
  mediaExcerpt: MediaExcerptView,
  urlLocator: UrlLocatorView,
  onClickUrlLocator: OnClickUrlLocator
) {
  const displayUrl = urlLocator.url.url;
  const textFragmentUrl =
    urlLocator.textFragmentUrl ??
    ("foundQuotation" in urlLocator.autoConfirmationStatus
      ? toUrlWithFragmentFromQuotation(
          urlLocator.url.url,
          urlLocator.autoConfirmationStatus.foundQuotation
        )
      : toUrlWithFragmentFromAnchors(urlLocator));
  const confirmationStatus = toConfirmationStatus(urlLocator);
  const creationInfo =
    urlLocator.creatorUserId !== mediaExcerpt.creatorUserId ||
    !urlLocator.created.isSame(mediaExcerpt.created) ? (
      <CreationInfo
        created={urlLocator.created}
        creator={urlLocator.creator}
        verb="added"
      />
    ) : null;

  function onClick(e: React.MouseEvent) {
    onClickUrlLocator(e, mediaExcerpt, urlLocator);
  }

  return (
    <a href={textFragmentUrl} onClick={onClick}>
      {displayUrl} {confirmationStatus} {creationInfo}
    </a>
  );
}

function toConfirmationStatus(urlLocator: UrlLocatorView) {
  switch (urlLocator.autoConfirmationStatus.status) {
    case "FOUND": {
      const { earliestFoundAt, latestFoundAt, foundQuotation } =
        urlLocator.autoConfirmationStatus;
      const timeDescription = toTimeDescription(earliestFoundAt, latestFoundAt);
      return (
        <MaterialSymbol
          icon="check_circle"
          className="auto-confirmation-icon found"
          size={13}
          title={`Auto-confirmed ${timeDescription} (“${foundQuotation}”)`}
        />
      );
    }
    case "PREVIOUSLY_FOUND": {
      const {
        foundQuotation,
        earliestFoundAt,
        latestFoundAt,
        earliestNotFoundAt,
        latestNotFoundAt,
      } = urlLocator.autoConfirmationStatus;
      const foundTimeDescription = toTimeDescription(
        earliestFoundAt,
        latestFoundAt
      );
      const notFoundTimeDescription = toTimeDescription(
        earliestNotFoundAt,
        latestNotFoundAt
      );
      return (
        <MaterialSymbol
          icon="error"
          className="auto-confirmation-icon previously-found"
          size={13}
          title={`Auto-confirmed previously ${foundTimeDescription}, but not found most recently ${notFoundTimeDescription} (“${foundQuotation}”)`}
        />
      );
    }
    case "NEVER_FOUND": {
      const { earliestNotFoundAt, latestNotFoundAt } =
        urlLocator.autoConfirmationStatus;
      const notFoundTimeDescription = toTimeDescription(
        earliestNotFoundAt,
        latestNotFoundAt
      );
      return (
        <MaterialSymbol
          icon="cancel"
          className="auto-confirmation-icon never-found"
          size={13}
          title={`Never auto-confirmed (tried ${notFoundTimeDescription})`}
        />
      );
    }
    case "NEVER_TRIED":
      return (
        <MaterialSymbol
          icon="do_not_disturb_on"
          className="auto-confirmation-icon never-tried"
          size={13}
          title={`Auto-confirmation not yet attempted`}
        />
      );
  }
}

function toTimeDescription(earlierMoment: Moment, laterMoment: Moment) {
  return !earlierMoment.isSame(laterMoment)
    ? `between ${earlierMoment.format(
        config.humanDateTimeFormat
      )} and ${laterMoment.format(config.humanDateTimeFormat)}`
    : `at ${earlierMoment.format(config.humanDateTimeFormat)}`;
}
