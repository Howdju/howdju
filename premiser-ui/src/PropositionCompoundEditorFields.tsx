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
  CreatePropositionCompoundAtomInput,
  CreatePropositionCompoundInput,
  UpdatePropositionCompoundInput,
  makeCreatePropositionCompoundAtomInput,
} from "howdju-common";
import { EntityEditorFieldsProps } from "./editors/withEditor";
import { EditorType } from "./reducers/editors";
import { editors } from "./actions";
import { AnyAction } from "@reduxjs/toolkit";

interface Props
  extends EntityEditorFieldsProps<UpdatePropositionCompoundInput> {
  propositionCompound?: CreatePropositionCompoundInput;
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
    editorDispatch,
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

  const onAddPropositionCompoundAtom = (index: number) =>
    editorDispatch((editorType: EditorType, editorId: string) =>
      editors.addListItem(
        editorType,
        editorId,
        index,
        combineNames(name, "atoms"),
        makeCreatePropositionCompoundAtomInput
      )
    );
  const onRemovePropositionCompoundAtom = (
    _atom: CreatePropositionCompoundAtomInput,
    index: number,
    atoms: CreatePropositionCompoundAtomInput[]
  ) =>
    editorDispatch((editorType: EditorType, editorId: string) => {
      const actions: AnyAction[] = [
        editors.removeListItem(
          editorType,
          editorId,
          index,
          combineNames(name, "atoms")
        ),
      ];
      // Don't let the atoms be empty
      if (atoms.length <= 1) {
        actions.push(
          editors.addListItem(
            editorType,
            editorId,
            index,
            combineNames(name, "atoms"),
            makeCreatePropositionCompoundAtomInput
          )
        );
      }
      return actions;
    });

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
