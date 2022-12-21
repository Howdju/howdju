import { Justification } from "howdju-common";
import { ComponentId } from "./types";

export const suggestionKeys = {
  createPropositionPageProposition: "createPropositionPageProposition",
  createPropositionPageJustification: "createPropositionPageJustification",
  counterJustificationEditor: (targetJustificationId: ComponentId) =>
    `counterJustificationEditor_${targetJustificationId}`,
  justificationBasisEditor: (justification: Justification) =>
    `justificationBasisEditor-${justification.id}-${justification.basis.type}-${justification.basis.entity.id}`,
};

export default {
  fixOpen: (autocomplete: any, text: string, autocompleteResults: any[]) => {
    if (
      text &&
      autocompleteResults.length === 0 &&
      autocomplete.state.visible
    ) {
      // react-md autocomplete incorrectly shows empty autocomplete results
      autocomplete._close();
    } else if (
      text &&
      autocomplete.state.focus &&
      // Another way we might check the focus, if we need to
      // window.document.activeElement === autocomplete._field
      autocompleteResults.length > 0 &&
      !autocomplete.state.visible
    ) {
      // react-md autocomplete incorrectly has menu hidden
      autocomplete.setState({ visible: true });
    }
  },
};
