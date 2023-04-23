import React, { ComponentType, ReactNode } from "react";

import EntityViewer from "./EntityViewer";
import { ComponentId, EditorId, SuggestionsKey } from "./types";

export type EntityComponentProps<
  EntityPropName extends string,
  Entity extends object
> = {
  id: ComponentId;
  editorId: EditorId;
  suggestionsKey: SuggestionsKey;
  showStatusText?: boolean;
} & { [key in EntityPropName]: Entity };

/**
 *
 * @param EntityComponent {Component} The component for rendering the entity
 * @param entityPropName {string} The prop name of the entity
 * @param iconName {string} The icon name to use
 * @param iconTitle {string} The title to use for hte icon
 * @param entityLinkFn {function<object,string>} creates a link to an entity. Only called when the entity is truthy.
 * @returns {Component}
 */
export default function withEntityViewer<
  EntityPropName extends string,
  Entity extends object
>(
  EntityComponent: ComponentType<EntityComponentProps<EntityPropName, Entity>>,
  entityPropName: EntityPropName,
  iconName: string,
  iconTitle: string,
  entityLinkFn: (entity: object) => string
) {
  type EntityViewerWrapperProps = {
    component?: ComponentType;
    id: ComponentId;
    className?: string;
    editorId: EditorId;
    suggestionsKey: SuggestionsKey;
    menu?: ReactNode;
    showStatusText?: boolean;
  } & { [key in typeof entityPropName]: object };
  return function EntityViewerWrapper(props: EntityViewerWrapperProps) {
    const {
      component,
      id,
      className,
      editorId,
      suggestionsKey,
      menu,
      showStatusText = true,
    } = props;
    const entity = props[entityPropName];
    const entityProps = {
      id,
      [entityPropName]: entity,
      editorId,
      suggestionsKey,
      showStatusText,
    } as EntityComponentProps<EntityPropName, Entity>;
    return (
      <EntityViewer
        iconName={iconName}
        iconTitle={iconTitle}
        iconLink={entity && entityLinkFn(entity)}
        className={className}
        component={component}
        entity={<EntityComponent {...entityProps} />}
        menu={menu}
      />
    );
  } as React.FC<EntityViewerWrapperProps>;
}
