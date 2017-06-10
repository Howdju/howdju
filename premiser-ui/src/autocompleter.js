export const suggestionKeys = {
  justificationEditor: 'justificationEditor',
  createStatementPageStatement: 'createStatementPageStatement',
  counterJustificationEditor: targetJustificationId => `counterJustificationEditor_${targetJustificationId}`
}

export default {
  fixOpen: (autocomplete, text, autocompleteResults) => {
    if (
        text &&
        autocompleteResults.length === 0 &&
        autocomplete.state.isOpen
    ) {
      // react-md autocomplete incorrectly shows empty autocomplete results
      autocomplete._close()
    } else if (
        text &&
        autocomplete.state.focus &&
        // Another way we might check the focus, if we need to
        // window.document.activeElement === autocomplete._field
        autocompleteResults.length > 0 &&
        !autocomplete.state.isOpen
    ) {
      // react-md autocomplete incorrectly has menu hidden
      autocomplete.setState({isOpen: true})
    }
  }
}
