import React from "react";
import { MaterialSymbol } from "react-material-symbols";

import {
  extractDomain,
  MediaExcerptView,
  toUrlWithFragment,
  UrlLocatorView,
} from "howdju-common";

import CollapsibleTextViewer from "@/components/collapsableText/CollapsableTextViewer";
import MediaExcerptCitationViewer from "./MediaExcerptCitationViewer";

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
      <ul className="url-locators">
        {mediaExcerpt.locators.urlLocators.map((urlLocator: UrlLocatorView) => (
          <li key={urlLocator.key} className="url">
            {toAnchorElement(urlLocator)}
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
            {speaker.name}
          </li>
        ))}
      </ul>
    </div>
  );
}

function toAnchorElement(urlLocator: UrlLocatorView) {
  const url = toUrlWithFragment(urlLocator);
  const domain = extractDomain(urlLocator.url.url);
  const urlLocatorCount = urlLocator.anchors?.length ?? 0;
  return (
    <a href={url}>
      {domain}{" "}
      {urlLocator.anchors?.length && (
        <MaterialSymbol
          icon="my_location"
          size={13}
          title="Has a fragment taking you directly to the excerpt"
        />
      )}
      {urlLocatorCount > 1 && { urlLocatorCount }}
    </a>
  );
}
