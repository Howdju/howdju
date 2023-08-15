import { every } from "lodash";
import { Moment } from "moment";

import {
  CreateSource,
  EntityId,
  isDefined,
  makeModelErrors,
  momentAdd,
  SourceOut,
  UpdateSource,
  utcNow,
} from "howdju-common";

import { SourcesDao } from "../daos";
import { EntityWrapper } from "../types";
import { readWriteReread, updateHandlingConstraints } from "./patterns";
import {
  ApiConfig,
  AuthorizationError,
  EntityNotFoundError,
  EntityTooOldToModifyError,
} from "..";
import { AuthService } from "./AuthService";
import { PermissionsService } from "./PermissionsService";
import { UserIdent } from "./types";

export class SourcesService {
  constructor(
    private config: ApiConfig,
    private authService: AuthService,
    private permissionsService: PermissionsService,
    private sourcesDao: SourcesDao
  ) {}

  async readSourcesForIds(sourceIds: EntityId[]): Promise<SourceOut[]> {
    const sources = await this.sourcesDao.readSourcesForIds(sourceIds);
    const missingSourceIds = sources
      .map((s, i) => (!s ? sourceIds[i] : undefined))
      .filter(isDefined);
    if (missingSourceIds.length) {
      throw new EntityNotFoundError("SOURCE", missingSourceIds);
    }
    return sources;
  }

  async readSourceForId(sourceId: EntityId): Promise<SourceOut> {
    const source = await this.sourcesDao.readSourceForId(sourceId);
    if (!source) {
      throw new EntityNotFoundError("SOURCE", sourceId);
    }
    return source;
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

  async updateSource(userIdent: UserIdent, updateSource: UpdateSource) {
    const userId = await this.authService.readUserIdForUserIdent(userIdent);
    const source = await this.sourcesDao.readSourceForId(updateSource.id);
    if (!source) {
      throw new EntityNotFoundError("SOURCE", updateSource.id);
    }

    await this.checkModifyPermission(userId, source);

    return await updateHandlingConstraints(
      updateSource,
      (s) => this.sourcesDao.updateSource(s),
      [
        {
          test: (_source, detail) => detail.includes("normal_description"),
          errors: makeModelErrors((e) =>
            e.description("A Source with that description already exists.")
          ),
        },
      ]
    );
  }

  async deleteSourceForId(userIdent: UserIdent, sourceId: EntityId) {
    const userId = await this.authService.readUserIdForUserIdent(userIdent);
    const source = await this.sourcesDao.readSourceForId(sourceId);
    if (!source) {
      throw new EntityNotFoundError("SOURCE", sourceId);
    }

    // TODO(473) can't delete own if relied upon
    await this.checkModifyPermission(userId, source);

    const deletedAt = utcNow();
    await this.sourcesDao.deleteSourceForId(sourceId, deletedAt);
  }

  private async checkModifyPermission(userId: EntityId, source: SourceOut) {
    const hasEditPermission = await this.permissionsService.userHasPermission(
      userId,
      "EDIT_ANY_ENTITY"
    );
    if (hasEditPermission) {
      return;
    }

    if (source.creatorUserId !== userId) {
      throw new AuthorizationError(
        makeModelErrors<UpdateSource>((e) =>
          e("Only a Source's creator may edit it.")
        )
      );
    }
    // TODO(473) disallow deletes if other users have already depended on it.
    if (
      utcNow().isAfter(
        momentAdd(source.created, this.config.modifyEntityGracePeriod)
      )
    ) {
      throw new EntityTooOldToModifyError(this.config.modifyEntityGracePeriod);
    }
  }
}
