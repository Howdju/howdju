import { JustificationBasis, JustificationView } from "howdju-common";

export const justificationBasisEditorId = (basis: JustificationBasis) =>
  `justificationBasis-${basis.type}-${basis.entity.id}-editorId`;
export const counterJustificationEditorId = (
  justification: JustificationView
) => `counterJustification-${justification.id}-editorId`;
