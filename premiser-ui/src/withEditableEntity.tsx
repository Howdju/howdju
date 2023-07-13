import React from "react";
import { CircularProgress } from "react-md";

import {
  AccountSettings,
  CreateSourceInput,
  isTruthy,
  logger,
  Persorg,
  Proposition,
  Source,
  UpdateSourceInput,
} from "howdju-common";
import { ComponentId, EditorId, SuggestionsKey } from "./types";
import { useAppSelector } from "./hooks";
import { EditorType } from "./reducers/editors";
import { WithEditorProps } from "./editors/withEditor";
import { defaultEditorId } from "./viewModels";
import { camelCase } from "lodash";

// TODO(460) infer this. Ideally we ensure that Editor and viewer both have a prop
// named like lowerCamelCase(editorType) and that both resolve to the same
// entity or model name.
type EntityPropNameProps<ET extends EditorType> = ET extends "PROPOSITION"
  ? { proposition?: Proposition }
  : ET extends "PERSORG"
  ? { persorg?: Persorg }
  : ET extends "ACCOUNT_SETTINGS"
  ? { accountSettings?: AccountSettings }
  : ET extends "SOURCE"
  ? { source?: Source | CreateSourceInput | UpdateSourceInput }
  : never;

interface EditorProps extends WithEditorProps {
  /** Required for the CircularProgress */
  id: ComponentId;
  /** Identifies the editor's state */
  editorId?: EditorId;
  /** If omitted, no autocomplete */
  suggestionsKey?: SuggestionsKey;
}
interface ViewerProps {
  id: ComponentId;
  showStatusText?: boolean;
}

/**
 * HOC for creating an editable entity component
 *
 * @param editorType The type of the editor.
 * @param EditorComponent The editor component. Shown when there is an active edit for the editor type and
 *     ID. The component must have a static property editorType of type string|EditorType.
 * @param ViewerComponent The viewer component. Shown when there is no active edit for the editor type and ID.
 * @typeparam E the type of the entity this component will display and edit.
 * @typeparam EP the props type of the editor component
 * @typeparam VP the props type of the viewer component
 * @returns An editable entity component
 */
export default function withEditableEntity<
  ET extends EditorType,
  EP extends EditorProps & EntityPropNameProps<ET>,
  VP extends ViewerProps & EntityPropNameProps<ET>
>(
  editorType: ET,
  EditorComponent: React.FC<EP>,
  ViewerComponent: React.FC<VP>
) {
  // Define the prop name for the entity that the component will receive.
  // Add additional supported entities here.

  type Props = {
    /** Required for the CircularProgress */
    id: ComponentId;
  } & EntityPropNameProps<ET> &
    EditorProps &
    ViewerProps;

  return function EditableEntity({
    id,
    editorId = defaultEditorId(id),
    suggestionsKey,
    showStatusText = true,
    ...rest
  }: Props) {
    const entityPropName = camelCase(editorType.toLowerCase());
    if (!(entityPropName in rest)) {
      logger.error(
        `withEditableEntity: ${editorType} entity not found in props.`
      );
    }
    const entity = (rest as any)[entityPropName];
    const editorStates = useAppSelector((state) => state.editors[editorType]);
    const { editEntity = null, isSaving = undefined } =
      editorStates?.[editorId] || {};
    const isEditing = isTruthy(editEntity);

    if (isEditing && !editorId) {
      logger.error("Should not be editing since we lack an editorId.");
    }

    const editorProps = {
      editorId,
      id,
      suggestionsKey,
      disabled: isSaving,
      ...rest,
    } as unknown as EP;
    // Cast as any to avoid
    // `Type 'EditorProps & EntityPropNameProps<ET>' is not assignable to type 'IntrinsicAttributes'`.
    // Removing EntityPropNameProps from EP fixes the issue.
    const editor = editorId ? (
      <EditorComponent {...(editorProps as any)} />
    ) : (
      <div />
    );

    const viewerProps = {
      id,
      showStatusText,
      ...rest,
    } as unknown as VP;
    // Cast for same reason as above.
    const viewer = <ViewerComponent {...(viewerProps as any)} />;

    const progress = <CircularProgress id={`${id}--loading`} />;

    return isEditing ? editor : entity ? viewer : progress;
  };
}
