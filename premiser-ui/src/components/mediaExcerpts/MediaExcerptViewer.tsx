import React from "react";

import CollapsibleTextViewer from "@/components/collapsableText/CollapsableTextViewer";
import MediaExcerptCitationViewer from "./MediaExcerptCitationViewer";
import { MediaExcerptView } from "@/viewModels";

import "./MediaExcerptViewer.scss";

interface Props {
  mediaExcerpt: MediaExcerptView;
}

// TODO(20) click URL: if extension installed, navigate to URL and highlight anchor.

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
              <a href={urlLocator.url.url}>{urlLocator.url.url}</a>
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
    </div>
  );
}
