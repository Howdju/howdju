import React from "react";

import { MediaExcerptView } from "howdju-common";

import CollapsibleTextViewer from "@/components/collapsableText/CollapsableTextViewer";
import MediaExcerptCitationViewer from "./MediaExcerptCitationViewer";

import "./MediaExcerptViewer.scss";
import { MaterialSymbol } from "react-material-symbols";

interface Props {
  mediaExcerpt: MediaExcerptView;
}

// TODO(38) group the urlLocators by URL and show a count of the number next to the anchor icon.
// If the user has the extension installed, then clicking on the anchor icon should open the
// extension and show the user the anchors for that URL. The user should be able to iterate through
// each distinct UrlLocator.
// Otherwise construct a text anchor URL and open it in a new tab.

export default function MediaExcerptViewer({ mediaExcerpt }: Props) {
  return (
    <div>
      <CollapsibleTextViewer
        className="quotation"
        text={mediaExcerpt.localRep.quotation}
      />
      <ul className="url-locators">
        {mediaExcerpt.locators.urlLocators.map(
          (urlLocator: MediaExcerptView["locators"]["urlLocators"][number]) => (
            <li key={urlLocator.key} className="url">
              <a href={urlLocator.url.url}>
                {urlLocator.url.url}{" "}
                {urlLocator.anchors?.length && (
                  <MaterialSymbol icon="anchor" size={13} />
                )}
              </a>
            </li>
          )
        )}
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
