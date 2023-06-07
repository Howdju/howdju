import { every } from "lodash";
import { Moment } from "moment";

import { CreateSource, EntityId } from "howdju-common";

import { SourcesDao } from "../daos";

export class SourcesService {
  sourcesDao: SourcesDao;
  constructor(sourcesDao: SourcesDao) {
    this.sourcesDao = sourcesDao;
  }

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
  ) {
    const extantSource = await this.sourcesDao.readEquivalentSource(
      createSource
    );
    if (extantSource) {
      return {
        source: extantSource,
        isExtant: true,
      };
    }
    const source = await this.sourcesDao.createSource(
      userId,
      createSource,
      created
    );
    return {
      source,
      isExtant: false,
    };
  }
}
