import React, { ReactNode } from "react";

import EntityViewer from "./EntityViewer";
import EditableWritQuote from "./EditableWritQuote";
import { ComponentId, EditorId } from "./types";
import { WritQuoteOut } from "howdju-common";
import { OnClickWritQuoteUrl } from "./WritQuoteViewer";

interface Props {
  id: ComponentId;
  writQuote: WritQuoteOut;
  editorId: EditorId;
  showUrls: boolean;
  showStatusText: boolean;
  onClickUrl: OnClickWritQuoteUrl;
  menu?: ReactNode;
}

export default function WritQuoteEntityViewer({
  id,
  writQuote,
  editorId,
  showUrls,
  showStatusText,
  onClickUrl,
  menu,
  ...rest
}: Props) {
  return (
    <EntityViewer
      iconName="format_quote"
      iconTitle="Writ quote"
      menu={menu}
      entity={
        <EditableWritQuote
          {...rest}
          id={id}
          writQuote={writQuote}
          editorId={editorId}
          showUrls={showUrls}
          showStatusText={showStatusText}
          onClickUrl={onClickUrl}
        />
      }
    />
  );
}
