export const suggestionKeys = {
  justificationEditor: 'justificationEditor',
  createStatementPage: 'createStatementPage',
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
        autocompleteResults.length === 0 &&
        !autocomplete.state.isOpen
    ) {
      // react-md autocomplete incorrectly has menu hidden
      autocomplete.setState({isOpen: true})
    }
  }
}
