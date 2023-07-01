import { Entity, EntityName } from "howdju-common";

export type EntityWrapper<T extends Entity> = {
  [key in Lowercase<EntityName<T>>]: T;
} & {
  isExtant: boolean;
};
