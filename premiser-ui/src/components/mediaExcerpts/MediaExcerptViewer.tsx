import React from "react";
import { MaterialSymbol } from "react-material-symbols";

import {
  MediaExcerptView,
  removeQueryParamsAndFragment,
  toUrlWithFragment,
  UrlLocatorView,
} from "howdju-common";

import CollapsibleTextViewer from "@/components/collapsableText/CollapsableTextViewer";
import MediaExcerptCitationViewer from "./MediaExcerptCitationViewer";
import paths from "@/paths";
import Link from "@/Link";
import CreationInfo from "../creationInfo/CreationInfo";

import "./MediaExcerptViewer.scss";

interface Props {
  mediaExcerpt: MediaExcerptView;
}

export default function MediaExcerptViewer({ mediaExcerpt }: Props) {
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
            {toAnchorElement(mediaExcerpt, urlLocator)}
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
        {mediaExcerpt.speakers.map((speaker) => (
          <li key={speaker.key} className="speaker">
            <Link to={paths.persorg(speaker)}>{speaker.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function toAnchorElement(
  mediaExcerpt: MediaExcerptView,
  urlLocator: UrlLocatorView
) {
  const url = toUrlWithFragment(urlLocator);
  const displayUrl = removeQueryParamsAndFragment(urlLocator.url.url);
  const anchorsIcon = urlLocator.anchors?.length ? (
    <MaterialSymbol
      icon="my_location"
      size={13}
      title="Has a fragment taking you directly to the excerpt"
    />
  ) : null;
  const confirmationStatus = toConfirmationStatus(urlLocator);
  const creationInfo =
    urlLocator.creatorUserId !== mediaExcerpt.creatorUserId ||
    urlLocator.created !== mediaExcerpt.created ? (
      <CreationInfo
        created={urlLocator.created}
        creator={urlLocator.creator}
        verb="added"
      />
    ) : null;

  return (
    <a href={url}>
      {displayUrl} {anchorsIcon} {confirmationStatus} {creationInfo}
    </a>
  );
}

function toConfirmationStatus(urlLocator: UrlLocatorView) {
  switch (urlLocator.autoConfirmationStatus.status) {
    case "FOUND": {
      const { earliestFoundAt, latestFoundAt, foundQuotation } =
        urlLocator.autoConfirmationStatus;
      return (
        <MaterialSymbol
          icon="check_circle"
          className="auto-confirmation-icon found"
          size={13}
          title={`Auto-confirmed between ${earliestFoundAt} ${latestFoundAt} (“${foundQuotation}”)`}
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
      return (
        <MaterialSymbol
          icon="error"
          className="auto-confirmation-icon previously-found"
          size={13}
          title={`Auto-confirmed previously between ${earliestFoundAt} and ${latestFoundAt}, but not found most recently betwen ${earliestNotFoundAt} and ${latestNotFoundAt} (“${foundQuotation}”)`}
        />
      );
    }
    case "NEVER_FOUND": {
      const { earliestNotFoundAt, latestNotFoundAt } =
        urlLocator.autoConfirmationStatus;
      return (
        <MaterialSymbol
          icon="cancel"
          className="auto-confirmation-icon never-found"
          size={13}
          title={`Never auto-confirmed (starting from ${earliestNotFoundAt} until ${latestNotFoundAt}`}
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
