import { SortDirection } from "howdju-common";

export const DatabaseSortDirection = {
  ASCENDING: "asc",
  DESCENDING: "desc",
} as const;
export type DatabaseSortDirection =
  typeof DatabaseSortDirection[keyof typeof DatabaseSortDirection];

export function toDbDirection(direction: SortDirection): DatabaseSortDirection {
  return direction === "descending" ? "desc" : "asc";
}
