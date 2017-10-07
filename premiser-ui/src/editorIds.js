export const statementJustificationsPage_statementEditor_editorId = 'statementJustificationsPage_statementEditor_editorId'
export const statementJustificationsPage_newJustificationDialog_newJustificationEditor_editorId = 'statementJustificationsPage_newJustificationDialog_newJustificationEditor_editorId'

export const loginPageEditorId = 'loginPageEditorId'

export const justificationBasisEditorId = basis => `justificationBasis-${basis.type}-${basis.entity.id}-editorId`
export const counterJustificationEditorId = justification => `counterJustification-${justification.id}-editorId`