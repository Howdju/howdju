import React from "react";
import { MaterialSymbol } from "react-material-symbols";

import withEntityViewer from "@/withEntityViewer";
import paths from "@/paths";
import StatementViewer from "./StatementViewer";

export default withEntityViewer(
  "statement",
  StatementViewer,
  <MaterialSymbol icon="message" size={24} />,
  "Statement",
  ({ id }) => paths.statement(id)
);
