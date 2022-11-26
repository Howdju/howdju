import React from "react";
import { Button, FontIcon } from "react-md";
import map from "lodash/map";
import get from "lodash/get";

import { toErrorText } from "./modelErrorMessages";
import ErrorMessages from "./ErrorMessages";
import SingleLineTextField from "./SingleLineTextField";
import PropositionTextAutocomplete from "./PropositionTextAutocomplete";
import { combineNames, combineIds, combineSuggestionsKeys } from "./viewModels";
import {
  BespokeValidationErrors,
  PropositionCompound,
  PropositionCompoundAtom,
} from "howdju-common";
import {
  ComponentId,
  ComponentName,
  OnAddCallback,
  OnPropertyChangeCallback,
  OnRemoveCallback,
  OnSubmitCallback,
  SuggestionsKey,
} from "./types";

const atomsName = "atoms";

type Props = {
  propositionCompound?: PropositionCompound;
  id: ComponentId;
  name: ComponentName;
  suggestionsKey?: SuggestionsKey;
  onPropertyChange: OnPropertyChangeCallback;
  onAddPropositionCompoundAtom: OnAddCallback;
  onRemovePropositionCompoundAtom: OnRemoveCallback<PropositionCompoundAtom>;
  errors?: BespokeValidationErrors;
  disabled?: boolean;
  onSubmit?: OnSubmitCallback;
};

export default function PropositionCompoundEditorFields(props: Props) {
  const {
    propositionCompound,
    name,
    id,
    suggestionsKey,
    disabled = false,
    errors,
    onAddPropositionCompoundAtom,
    onRemovePropositionCompoundAtom,
    onPropertyChange,
    onSubmit,
  } = props;
  const atoms = get(propositionCompound, atomsName, []);
  const hasErrors = errors && errors.hasErrors;
  const atomsErrorsInputProps = hasErrors
    ? map(errors.fieldErrors.atoms.itemErrors, (atomError) =>
        atomError.fieldErrors.entity.fieldErrors.text.length > 0
          ? {
              error: true,
              errorText: toErrorText(
                atomError.fieldErrors.entity.fieldErrors.text
              ),
            }
          : {}
      )
    : map(atoms, () => null);
  return (
    <div>
      {map(atoms, (atom, index) => {
        const atomPropositionTextName = `atoms[${index}].entity.text`; // TODO .entity or .proposition?
        const value = get(propositionCompound, atomPropositionTextName, "");
        const leftIcon = <FontIcon>short_text</FontIcon>;
        const rightIcon = disabled ? (
          <div />
        ) : (
          <div>
            <Button icon onClick={() => onAddPropositionCompoundAtom(index)}>
              add
            </Button>
            <Button
              icon
              onClick={() => onRemovePropositionCompoundAtom(atom, index)}
            >
              delete
            </Button>
          </div>
        );
        const inputProps = {
          id: combineIds(id, atomPropositionTextName),
          key: atomPropositionTextName,
          name: combineNames(name, atomPropositionTextName),
          value,
          label: "Text",
          leftIcon,
          leftIconStateful: true,
          rightIcon,
          rightIconStateful: false,
          disabled,
          onPropertyChange,
          onSubmit,
        };
        return suggestionsKey && !disabled ? (
          <PropositionTextAutocomplete
            {...inputProps}
            {...atomsErrorsInputProps[index]}
            suggestionsKey={combineSuggestionsKeys(
              suggestionsKey,
              atomPropositionTextName
            )}
          />
        ) : (
          <SingleLineTextField
            {...inputProps}
            {...atomsErrorsInputProps[index]}
          />
        );
      })}
      <Button
        flat
        className="add-button"
        key="addPropositionCompoundAtomButton"
        title="Add Proposition"
        onClick={() => onAddPropositionCompoundAtom(atoms.length)}
      >
        add
      </Button>
      {hasErrors && errors.modelErrors && (
        <ErrorMessages errors={errors.modelErrors} />
      )}
    </div>
  );
}
