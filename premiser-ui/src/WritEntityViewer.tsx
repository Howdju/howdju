import React, { ReactNode } from "react";

import EntityViewer from "./EntityViewer";
import EditableWrit from "./EditableWrit";
import { ComponentId } from "./types";
import { WritOut } from "howdju-common";

interface WritEntityViewerProps {
  id: ComponentId;
  writ: WritOut;
  menu?: ReactNode;
}

export default function WritEntityViewer({
  id,
  writ,
  menu,
}: WritEntityViewerProps) {
  return (
    <EntityViewer
      iconName="book"
      iconTitle="Writ"
      entity={<EditableWrit id={id} writ={writ} />}
      menu={menu}
    />
  );
}
