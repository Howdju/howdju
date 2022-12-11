import React from "react";
import { Button, FontIcon } from "react-md";
import map from "lodash/map";
import get from "lodash/get";

import { makeErrorPropCreator } from "./modelErrorMessages";
import ErrorMessages from "./ErrorMessages";
import SingleLineTextField from "./SingleLineTextField";
import PropositionTextAutocomplete from "./PropositionTextAutocomplete";
import { combineNames, combineIds, combineSuggestionsKeys } from "./viewModels";
import {
  EditPropositionCompoundInput,
  PropositionCompound,
  PropositionCompoundAtom,
} from "howdju-common";
import { OnAddCallback, OnRemoveCallback } from "./types";
import { EntityEditorFieldsProps } from "./editors/withEditor";

interface Props extends EntityEditorFieldsProps<EditPropositionCompoundInput> {
  propositionCompound?: PropositionCompound;
  onAddPropositionCompoundAtom: OnAddCallback;
  onRemovePropositionCompoundAtom: OnRemoveCallback<PropositionCompoundAtom>;
}

export default function PropositionCompoundEditorFields(props: Props) {
  const {
    propositionCompound,
    name,
    id,
    suggestionsKey,
    disabled = false,
    errors,
    dirtyFields,
    blurredFields,
    onAddPropositionCompoundAtom,
    onRemovePropositionCompoundAtom,
    onBlur,
    onPropertyChange,
    onSubmit,
    wasSubmitAttempted,
  } = props;
  const atoms = propositionCompound?.atoms;

  const errorProps = makeErrorPropCreator(
    wasSubmitAttempted,
    errors,
    dirtyFields,
    blurredFields
  );

  return (
    <div>
      {map(atoms, (atom, index, atoms) => {
        const atomPropositionTextName = `atoms[${index}].entity.text`;
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
              onClick={() =>
                onRemovePropositionCompoundAtom(atom, index, atoms)
              }
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
          onBlur,
          onPropertyChange,
          onSubmit,
          ...errorProps((pc) => pc.atoms[index].entity.text),
        };
        return suggestionsKey && !disabled ? (
          <PropositionTextAutocomplete
            {...inputProps}
            suggestionsKey={combineSuggestionsKeys(
              suggestionsKey,
              atomPropositionTextName
            )}
          />
        ) : (
          <SingleLineTextField {...inputProps} />
        );
      })}
      <ErrorMessages errors={errors?._errors} />
    </div>
  );
}
