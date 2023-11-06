import React from "react";
import { MaterialSymbol } from "react-material-symbols";

import { AppearanceOut } from "howdju-common";

import withEntityViewer from "@/withEntityViewer";
import paths from "@/paths";
import AppearanceViewer from "./AppearanceViewer";

export default withEntityViewer(
  "appearance",
  AppearanceViewer,
  <MaterialSymbol icon="pin_drop" size={24} />,
  "Appearance",
  (appearance: AppearanceOut) => paths.appearance(appearance.id)
);
