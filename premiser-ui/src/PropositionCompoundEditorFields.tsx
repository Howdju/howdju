import React from "react";
import { AnyAction } from "@reduxjs/toolkit";
import { FontIcon } from "react-md";
import get from "lodash/get";

import {
  CreatePropositionCompoundAtomInput,
  UpdatePropositionCompoundInput,
  makeCreatePropositionCompoundAtomInput,
  CreatePropositionCompoundInput,
} from "howdju-common";

import { makeErrorPropCreator } from "./modelErrorMessages";
import ErrorMessages from "./ErrorMessages";
import SingleLineTextArea from "@/components/text/SingleLineTextArea";
import PropositionTextAutocomplete from "./PropositionTextAutocomplete";
import { combineNames, combineIds, combineSuggestionsKeys } from "./viewModels";
import { EntityEditorFieldsProps } from "./editors/withEditor";
import { EditorType } from "./reducers/editors";
import { editors } from "./actions";
import IconButton from "./components/button/IconButton";

interface Props
  extends EntityEditorFieldsProps<
    "propositionCompound",
    CreatePropositionCompoundInput | UpdatePropositionCompoundInput
  > {}

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
    ...rest
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
        combineNames(name, "atoms"),
        index + 1,
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
          combineNames(name, "atoms"),
          index
        ),
      ];
      // Don't let the atoms be empty
      if (atoms.length <= 1) {
        actions.push(
          editors.addListItem(
            editorType,
            editorId,
            combineNames(name, "atoms"),
            index,
            makeCreatePropositionCompoundAtomInput
          )
        );
      }
      return actions;
    });

  return (
    <div {...rest}>
      {atoms?.map((atom, index, atoms) => {
        const atomPropositionTextName = `atoms[${index}].entity.text`;
        const value = get(propositionCompound, atomPropositionTextName, "");
        const leftChildren = <FontIcon>short_text</FontIcon>;
        const rightControls = disabled ? (
          <div />
        ) : (
          <>
            <IconButton
              title="Add atom"
              onClick={() => onAddPropositionCompoundAtom(index)}
            >
              <FontIcon>add</FontIcon>
            </IconButton>
            <IconButton
              onClick={() =>
                onRemovePropositionCompoundAtom(atom, index, atoms)
              }
            >
              <FontIcon>delete</FontIcon>
            </IconButton>
          </>
        );
        const inputProps = {
          id: combineIds(id, atomPropositionTextName),
          key: atomPropositionTextName,
          name: combineNames(name, atomPropositionTextName),
          value,
          label: "Text",
          leftChildren,
          rightControls,
          disabled,
          onBlur,
          onPropertyChange,
          onSubmit,
          messageProps: errorProps((pc) => pc.atoms[index].entity.text),
        };
        const input =
          suggestionsKey && !disabled ? (
            <PropositionTextAutocomplete
              {...inputProps}
              suggestionsKey={combineSuggestionsKeys(
                suggestionsKey,
                atomPropositionTextName
              )}
            />
          ) : (
            <SingleLineTextArea {...inputProps} />
          );
        return (
          <div key={`atom ${atom.key}`}>
            {input}
            <ErrorMessages errors={errors?.atoms?.[index]?._errors} />
            <ErrorMessages errors={errors?.atoms?.[index]?.entity?._errors} />
          </div>
        );
      })}
      <ErrorMessages errors={errors?._errors} />
    </div>
  );
}
