import React from "react";
import { MaterialSymbol } from "react-material-symbols";

import { MediaExcerptView } from "howdju-common";

import withEntityViewer from "@/withEntityViewer";
import paths from "@/paths";
import MediaExcerptViewer from "./MediaExcerptViewer";

export default withEntityViewer<"mediaExcerpt", MediaExcerptView>(
  MediaExcerptViewer,
  "mediaExcerpt",
  <MaterialSymbol icon="format_quote" size={24} />,
  "Media Excerpt",
  paths.mediaExcerpt
);
