import React from 'react';
import {
  Button,
  CardActions,
  CardText,
  CircularProgress,
} from 'react-md';
import { useDispatch, useSelector } from 'react-redux';
import get from 'lodash/get';
import reduce from 'lodash/reduce';

import {validate, emptyValidationResult} from "howdju-ajv-sourced"

import { editors, flows } from '@/actions';
import { AppDispatch, RootState } from '@/store';
import {combineIds, combineSuggestionsKeys} from '@/viewModels';
import t, { CANCEL_BUTTON_LABEL, EDIT_ENTITY_SUBMIT_BUTTON_LABEL } from '@/texts';
import { AnyAction } from 'redux';
import { DirtyFields, EditorFieldsErrors, EditorType } from '@/reducers/editors';
import { logger, SchemaId, toJson } from 'howdju-common';
import { isEqual, merge } from 'lodash';
import { PropertyChanges } from '@/types';

type OnPropertyChangeCallback = (properties: PropertyChanges) => void


export interface EntityEditorFieldsProps {
  id: string
  disabled: boolean
  suggestionsKey: string
  onPropertyChange: OnPropertyChangeCallback
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  errors: EditorFieldsErrors
  dirtyFields: DirtyFields
  wasSubmitAttempted: boolean
}

interface EditorState {
  errors: EditorFieldsErrors,
  editEntity: {},
  isFetching: boolean,
  isSaving: boolean,
  // TODO make EditorState generic so that dirtyFields knows the actual editEntity fields?
  dirtyFields: DirtyFields,
  wasSubmitAttempted: boolean,
}

export type CommitThenPutAction = {
  // TODO(1): make specific to actions: ReturnType<ActionCreator> ActionCreator in keyof Group in keyof actions
  action: AnyAction
}

type ListItemTranslator = (editorType: EditorType, editorId: string, dispatch: AppDispatch) =>
  (...args : any[]) => void;

type WithEditorProps = {
  id: string,
  editorId: string,
  menu?: JSX.Element,
  className?: string,
  submitButtonText?: string,
  editorCommitBehavior: 'JustCommit' | 'CommitThenView' | CommitThenPutAction
}

/**
 * A HOC for creating a form for editing an entity.
 *
 * Fires the appropriate editor actions for editing, submitting, and canceling.
 *
 * @param editorType The editor type to determine editor behaviors and state location.
 * @param EntityEditorFields The EditorFields class for the entity.
 * @param entityPropName The field on EntityEditorFields for the editEntity
 * @param schemaId: The ID of the schema to use to validate the entity.
 * @param listItemTranslators An object keyed by callbacks for attributes of
 *   EntityEditorFields that produce callbacks that will dispatch the
 *   correct addListItem/removeListItem editor actions.
 */
export default function withEditor(
  editorType: EditorType,
  EntityEditorFields: React.ComponentType<EntityEditorFieldsProps>,
  entityPropName: string,
  schemaId: SchemaId,
  listItemTranslators?: {[key: string]: ListItemTranslator}
) {
  return function EntityEditor(props: WithEditorProps) {
    const {
      id,
      editorId,
      menu,
      className,
      submitButtonText,
      editorCommitBehavior,
      ...rest
    } = props

    const dispatch = useDispatch();

    const onPropertyChange = (properties: {[key: string]: string}) => {
      dispatch(editors.propertyChange(editorType, editorId, properties))
    }
    const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      if (editorCommitBehavior === 'JustCommit') {
        dispatch(editors.commitEdit(editorType, editorId))
      } else if (editorCommitBehavior === 'CommitThenView') {
        dispatch(flows.commitEditThenView(editorType, editorId))
      } else if (editorCommitBehavior.action) {
        dispatch(flows.commitEditThenPutActionOnSuccess(editorType, editorId, editorCommitBehavior.action))
      }
    }
    const onCancelEdit = () => {
      dispatch(editors.cancelEdit(editorType, editorId))
    }

    // Create callbacks to add/remove items from the lists in the entity.
    const listItemCallbackAttributes = reduce(listItemTranslators, (acc, translator, key) => {
      acc[key] = translator(editorType, editorId, dispatch);
      return acc;
    }, {} as {[key: string]: (...args : any[]) => void});

    const editorState = useSelector((state: RootState) => get(state.editors, [editorType, editorId], {}));
    const {
      errors: apiValidationErrors,
      editEntity,
      isFetching,
      isSaving,
      dirtyFields,
      wasSubmitAttempted,
    } = editorState as EditorState;
    const inProgress = isFetching || isSaving


    const {errors: clientValidationErrors} = editEntity ?
      validate(schemaId, editEntity) :
      emptyValidationResult()
    // Because the API should validate the same data using the same schema, it shouldn't be possible
    // to receive API errors that didn't also fail client validation.
    if (apiValidationErrors && !isEqual(clientValidationErrors, apiValidationErrors)) {
      logger.error(`clientValidationErrors and apiValidationErrors do not match ` +
          `${toJson({clientValidationErrors, apiValidationErrors})}`)
    }
    // apiValidationErrors comes after so that it will override clientValidationErrors, since ultimately the API
    // must accept the value.
    const errors = merge(clientValidationErrors, apiValidationErrors)

    return (
      <form onSubmit={onSubmit} className={className}>
        <CardText>
          <EntityEditorFields
            {...rest}
            id={id}
            {...{[entityPropName]: editEntity}}
            disabled={isSaving}
            suggestionsKey={combineSuggestionsKeys(editorType, editorId)}
            onPropertyChange={onPropertyChange}
            onSubmit={onSubmit}
            {...listItemCallbackAttributes}
            errors={errors}
            dirtyFields={dirtyFields}
            wasSubmitAttempted={wasSubmitAttempted}
          />
        </CardText>
        <CardActions>
          {inProgress && <CircularProgress key="progress" id={combineIds(id, "progress")} />}
          <Button flat
                  key="cancelButton"
                  children={t(CANCEL_BUTTON_LABEL)}
                  onClick={onCancelEdit}
                  disabled={inProgress}
          />
          <Button raised
                  primary
                  key="submitButton"
                  type="submit"
                  children={t(submitButtonText || EDIT_ENTITY_SUBMIT_BUTTON_LABEL)}
                  disabled={inProgress}
          />
        </CardActions>
      </form>
    )
  }
}
