export const suggestionKeys = {
  createStatementPageStatement: 'createStatementPageStatement',
  createStatementPageJustification: 'createStatementPageJustification',
  counterJustificationEditor: targetJustificationId => `counterJustificationEditor_${targetJustificationId}`,
  statementJustificationsPage_newJustificationDialog_newJustificationEditor_suggestions: 'statementJustificationsPage_newJustificationDialog_newJustificationEditor_suggestions',
  justificationBasisEditor: justification => `justificationBasisEditor-${justification.id}-${justification.basis.type}-${justification.basis.entity.id}`,
  statementJustificationsPage_statementEditor: 'statementJustificationsPage_statementEditor',
}
