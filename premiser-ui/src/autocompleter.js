export const suggestionKeys = {
  createStatementPageStatement: 'createStatementPageStatement',
  createStatementPageJustification: 'createStatementPageJustification',
  counterJustificationEditor: targetJustificationId => `counterJustificationEditor_${targetJustificationId}`,
  statementJustificationsPage_newJustificationDialog_newJustificationEditor_suggestions: 'statementJustificationsPage_newJustificationDialog_newJustificationEditor_suggestions',
  justificationBasisEditor: justification => `justificationBasisEditor-${justification.id}-${justification.basis.type}-${justification.basis.entity.id}`,
  statementJustificationsPage_statementEditor: 'statementJustificationsPage_statementEditor',
}

export default {
  fixOpen: (autocomplete, text, autocompleteResults) => {
    if (
      text &&
      autocompleteResults.length === 0 &&
      autocomplete.state.visible
    ) {
      // react-md autocomplete incorrectly shows empty autocomplete results
      autocomplete._close()
    } else if (
      text &&
      autocomplete.state.focus &&
      // Another way we might check the focus, if we need to
      // window.document.activeElement === autocomplete._field
      autocompleteResults.length > 0 &&
      !autocomplete.state.visible
    ) {
      // react-md autocomplete incorrectly has menu hidden
      autocomplete.setState({visible: true})
    }
  }
}
