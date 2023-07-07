import React, { ComponentType, ReactNode } from "react";
import { Card, CardText } from "react-md";
import cn from "classnames";

import { ComponentId, EditorId, SuggestionsKey } from "./types";
import { combineIds } from "./viewModels";
import { omit } from "lodash";

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
  Entity extends object
>(
  EntityViewerComponent: ComponentType<
    EntityViewerProps<EntityPropName, Entity>
  >,
  entityPropName: EntityPropName
) {
  type EntityCardProps = {
    id: ComponentId;
    editorId?: EditorId;
    suggestionsKey?: SuggestionsKey;
    menu?: ReactNode;
    className?: string;
  } & { [key in EntityPropName]: Entity };
  // TODO(221) convert to functional component
  return class EntityCard extends React.Component<EntityCardProps> {
    render() {
      const { id, editorId, menu, suggestionsKey, className, ...rest } =
        this.props;

      const entityProps = {
        id: combineIds(id, "entity-viewer"),
        [entityPropName]: this.props[entityPropName],
        editorId,
        suggestionsKey,
        menu,
      } as EntityViewerProps<EntityPropName, Entity>;
      return (
        <Card
          className={cn("entity-card", className)}
          {...omit(rest, entityPropName)}
        >
          <CardText className="entity-card-contents">
            <EntityViewerComponent {...entityProps} />
          </CardText>
        </Card>
      );
    }
  };
}
