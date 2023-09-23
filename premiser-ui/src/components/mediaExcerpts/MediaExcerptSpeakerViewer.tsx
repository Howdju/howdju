import React from "react";

import Link from "@/Link";
import paths from "@/paths";
import { MediaExcerptSpeakerView } from "howdju-common";

interface Props {
  speaker: MediaExcerptSpeakerView;
}

export default function MediaExcerptSpeakerViewer({
  speaker: { persorg },
}: Props) {
  return <Link to={paths.persorg(persorg)}>{persorg.name}</Link>;
}
