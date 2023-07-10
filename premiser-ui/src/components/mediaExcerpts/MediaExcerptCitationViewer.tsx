import React from "react";

import { MediaExcerptCitationOut } from "howdju-common";

import Link from "@/Link";
import paths from "@/paths";

interface Props {
  citation: MediaExcerptCitationOut;
}

export default function MediaExcerptCitationViewer({ citation }: Props) {
  const { source, pincite } = citation;
  return (
    <>
      <Link to={paths.source(source)}>{source.description}</Link>
      {pincite && ` (${pincite})`}
    </>
  );
}
