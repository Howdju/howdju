import React from "react";
import { MaterialSymbol } from "react-material-symbols";

import withEntityViewer from "@/withEntityViewer";
import paths from "@/paths";
import MediaExcerptViewer from "./MediaExcerptViewer";

export default withEntityViewer(
  "mediaExcerpt",
  MediaExcerptViewer,
  <MaterialSymbol icon="format_quote" size={24} />,
  "Media Excerpt",
  paths.mediaExcerpt
);
