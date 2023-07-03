import { every } from "lodash";
import { Moment } from "moment";

import { CreateSource, EntityId, SourceOut } from "howdju-common";

import { SourcesDao } from "../daos";
import { EntityWrapper } from "../types";
import { readWriteReread } from "./patterns";

export class SourcesService {
  constructor(private sourcesDao: SourcesDao) {}

  async readOrCreateSources(
    userId: EntityId,
    createSources: CreateSource[],
    created: Moment
  ) {
    const result = await Promise.all(
      createSources.map((s) => this.readOrCreateSource(userId, s, created))
    );
    const sources = result.map((r) => r.source);
    const isExtant = every(result.map((r) => r.isExtant));
    return {
      sources,
      isExtant,
    };
  }

  async readOrCreateSource(
    userId: EntityId,
    createSource: CreateSource,
    created: Moment
  ): Promise<EntityWrapper<SourceOut>> {
    const { entity, isExtant } = await readWriteReread(
      () => this.sourcesDao.readEquivalentSource(createSource),
      () => this.sourcesDao.createSource(userId, createSource, created)
    );
    return {
      source: entity,
      isExtant,
    };
  }
}
