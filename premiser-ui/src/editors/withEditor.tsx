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

import { editors, flows } from '@/actions';
import { AppDispatch, RootState } from '@/store';
import {combineIds, combineSuggestionsKeys} from '@/viewModels';
import t, { CANCEL_BUTTON_LABEL, EDIT_ENTITY_SUBMIT_BUTTON_LABEL } from '@/texts';
import { AnyAction } from 'redux';

type OnPropertyChangeCallback = (properties: {[key: string]: any}) => void
// A map of maps bottoming out in strings.
type EditorFieldsErrors = {[key: string]: string} | {[key: string]: EditorFieldsErrors};

export interface EntityEditorFieldsProps {
  id: string
  disabled: boolean
  suggestionsKey: string
  onPropertyChange: OnPropertyChangeCallback
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  errors: EditorFieldsErrors
}

interface EditorState {
  errors: EditorFieldsErrors,
  editEntity: {},
  isFetching: boolean,
  isSaving: boolean
}

export type CommitThenPutAction = {
  // TODO(1): make specific to actions: ReturnType<ActionCreator> ActionCreator in keyof Group in keyof actions
  action: AnyAction
}

type ListItemTranslator = (editorType: string, editorId: string, dispatch: AppDispatch) =>
  (...args : any[]) => void;

type WithEditorProps = {
  id: string,
  editorType: string,
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
 * @param EntityEditorFields The EditorFields class for the entity.
 * @param entityPropName The field on EntityEditorFields for the editEntity
 * @param listItemTranslators An object keyed by callbacks for attributes of
 *   EntityEditorFields that produce callbacks that will dispatch the
 *   correct addListItem/removeListItem editor actions.
 */
export default function withEditor(
  EntityEditorFields: React.ComponentType<EntityEditorFieldsProps>,
  entityPropName: string,
  listItemTranslators: {[key: string]: ListItemTranslator}
) {
  return function EntityEditor(props: WithEditorProps) {
    const {
      id,
      editorType,
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
      errors,
      editEntity,
      isFetching,
      isSaving,
    } = editorState as EditorState;
    const inProgress = isFetching || isSaving

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
