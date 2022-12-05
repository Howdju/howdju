import { EditorType } from "@/reducers/editors";
import { PayloadAction } from "@reduxjs/toolkit";
import { EntityId } from "howdju-common";

export type EditorAction = PayloadAction<{
  editorType: EditorType;
  editorId: EntityId;
}>;
