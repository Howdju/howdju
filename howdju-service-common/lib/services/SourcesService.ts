import { every } from "lodash";
import { Moment } from "moment";

import {
  CreateSource,
  EntityId,
  Logger,
  SourceOut,
  toJson,
} from "howdju-common";

import { SourcesDao } from "../daos";
import { DatabaseError } from "pg";
import { EntityWrapper } from "@/types";

const CONSTRAINT_VIOLATION_CODE = "23505";

export class SourcesService {
  constructor(private logger: Logger, private sourcesDao: SourcesDao) {}

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
    const extantSource = await this.sourcesDao.readEquivalentSource(
      createSource
    );
    if (extantSource) {
      return {
        source: extantSource,
        isExtant: true,
      };
    }
    try {
      const source = await this.sourcesDao.createSource(
        userId,
        createSource,
        created
      );
      return {
        source,
        isExtant: false,
      };
    } catch (err) {
      if (!(err instanceof Error)) {
        throw new Error(`Thrown was not an Error: ${toJson(err)}`);
      }
      if (!(err instanceof DatabaseError)) {
        throw new Error(
          `Thrown was not a DatabaseError (${err.constructor.name}): ${toJson(
            err
          )}`
        );
      }
      if (err.code !== CONSTRAINT_VIOLATION_CODE) {
        throw err;
      }

      const { detail, constraint } = err;
      this.logger.info(
        `An intervening row was created: ${{ detail, constraint }}`
      );

      const interveningSource = await this.sourcesDao.readEquivalentSource(
        createSource
      );
      if (!interveningSource) {
        throw new Error(
          "No intervening source despite unique constraint violation."
        );
      }
      return {
        source: interveningSource,
        isExtant: true,
      };
    }
  }
}
