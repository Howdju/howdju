export const suggestionKeys = {
  createPropositionPageProposition: 'createPropositionPageProposition',
  createPropositionPageJustification: 'createPropositionPageJustification',
  counterJustificationEditor: targetJustificationId => `counterJustificationEditor_${targetJustificationId}`,
  propositionJustificationsPage_newJustificationDialog_newJustificationEditor_suggestions: 'propositionJustificationsPage_newJustificationDialog_newJustificationEditor_suggestions',
  justificationBasisEditor: justification => `justificationBasisEditor-${justification.id}-${justification.basis.type}-${justification.basis.entity.id}`,
  propositionJustificationsPage_propositionEditor: 'propositionJustificationsPage_propositionEditor',
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
