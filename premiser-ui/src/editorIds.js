export const editStatementJustificationPageEditorId = 'editStatementJustificationPageEditorId'
export const statementJustificationsPageStatementEditorId = 'statementJustificationsPageStatementEditorId'
export const statementJustificationsPageNewJustificationEditorId = 'statementJustificationsPageNewJustificationEditorId'

export const loginPageEditorId = 'loginPageEditorId'

export const justificationBasisEditorId = basis => `justificationBasis-${basis.type}-${basis.entity.id}-editorId`
export const counterJustificationEditorId = justification => `counterJustification-${justification.id}-editorId`