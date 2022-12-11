import { EditorType } from "@/reducers/editors";
import { PayloadAction } from "@reduxjs/toolkit";
import { EntityId } from "howdju-common";

/** Editor actions must have a type and an ID. */
export type EditorAction = PayloadAction<{
  editorType: EditorType;
  editorId: EntityId;
}>;
