import React, { ComponentType, ReactNode } from "react";
import { Card, CardContent } from "@/components/card/Card";
import cn from "classnames";

import { ContextTrailItem } from "howdju-common";

import { ComponentId, EditorId, SuggestionsKey } from "./types";
import { combineIds } from "./viewModels";

export type EntityViewerProps<
  EntityPropName extends string,
  Entity extends object
> = {
  id: ComponentId;
  editorId?: EditorId;
  suggestionsKey?: SuggestionsKey;
} & { [key in EntityPropName]: Entity };

export default function withEntityCard<
  EntityPropName extends string,
  Entity extends object,
  ComponentProps extends EntityViewerProps<EntityPropName, Entity>
>(
  EntityViewerComponent: ComponentType<ComponentProps>,
  entityPropName: EntityPropName
) {
  type EntityCardProps = {
    id: ComponentId;
    editorId?: EditorId;
    suggestionsKey?: SuggestionsKey;
    menu?: ReactNode;
    className?: string;
    contextTrailItems?: ContextTrailItem[];
  } & { [key in EntityPropName]: Entity } & Omit<
      ComponentProps,
      keyof EntityViewerProps<EntityPropName, Entity>
    >;
  // TODO(221) convert to functional component
  return class EntityCard extends React.Component<EntityCardProps> {
    render() {
      const {
        id,
        editorId,
        menu,
        suggestionsKey,
        className,
        contextTrailItems,
        ...rest
      } = this.props;

      const entityProps = {
        id: combineIds(id, "entity-viewer"),
        [entityPropName]: this.props[entityPropName],
        editorId,
        suggestionsKey,
        menu,
        contextTrailItems,
        ...rest,
      } as unknown as ComponentProps;
      return (
        <Card className={cn("entity-card", className)}>
          <CardContent className="entity-card-contents">
            <EntityViewerComponent {...entityProps} />
          </CardContent>
        </Card>
      );
    }
  };
}
