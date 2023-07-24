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
      {displayUrl} {anchorsIcon} {creationInfo}
    </a>
  );
}
