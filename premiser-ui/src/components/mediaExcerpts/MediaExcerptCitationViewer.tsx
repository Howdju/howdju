import React from "react";

import { MediaExcerptCitationOut } from "howdju-common";

interface Props {
  citation: MediaExcerptCitationOut;
}

export default function MediaExcerptCitationViewer({ citation }: Props) {
  const { source, pincite } = citation;
  return (
    <>
      <span>{source.descriptionApa}</span>
      {pincite && `(${pincite})`}
    </>
  );
}
