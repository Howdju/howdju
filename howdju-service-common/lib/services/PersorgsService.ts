import { Moment } from "moment";

import {
  entityConflictCodes,
  EntityId,
  CreatePersorg,
  UpdatePersorg,
  PersorgOut,
  makeModelErrors,
  authorizationErrorCodes,
  newUnimplementedError,
  utcNow,
  momentAdd,
} from "howdju-common";

import {
  AuthorizationError,
  EntityNotFoundError,
  EntityConflictError,
  EntityTooOldToModifyError,
} from "../serviceErrors";
import { persorgSchema } from "./validationSchemas";
import { PermissionsService } from "./PermissionsService";
import { AuthService } from "./AuthService";
import { EntityService } from "./EntityService";
import { MediaExcerptsDao, PersorgData, PersorgsDao } from "../daos";
import { readWriteReread } from "./patterns";
import { UserIdent } from "./types";
import { ApiConfig } from "..";

export class PersorgsService extends EntityService<
  CreatePersorg,
  PersorgOut,
  UpdatePersorg,
  PersorgOut,
  "persorg"
> {
  constructor(
    private config: ApiConfig,
    authService: AuthService,
    private permissionsService: PermissionsService,
    private persorgsDao: PersorgsDao,
    private mediaExcerptsDao: MediaExcerptsDao
  ) {
    super(persorgSchema, authService);
  }

  async readPersorgForId(persorgId: EntityId) {
    return await this.persorgsDao.readPersorgForId(persorgId);
  }

  async readOrCreateValidPersorgAsUser(
    createPersorg: CreatePersorg,
    userId: EntityId,
    now: Date
  ): Promise<{ isExtant: boolean; persorg: PersorgOut }> {
    const { entity: persorg, isExtant } = await readWriteReread(
      () => this.persorgsDao.readEquivalentPersorg(createPersorg),
      () => this.persorgsDao.createPersorg(createPersorg, userId, now)
    );
    return {
      isExtant,
      persorg,
    };
  }

  async readOrCreatePersorgs(
    userId: EntityId,
    createPersorgs: CreatePersorg[],
    created: Moment
  ) {
    const result = await Promise.all(
      createPersorgs.map((p) =>
        this.readOrCreateValidPersorgAsUser(p, userId, created.toDate())
      )
    );
    const isExtant = result.every((r) => r.isExtant);
    const persorgs = result.map((r) => r.persorg);
    return {
      persorgs,
      isExtant,
    };
  }

  protected doReadOrCreate(
    _entity: CreatePersorg,
    _userId: EntityId,
    _now: Moment
  ): Promise<{ isExtant: boolean; persorg: PersorgOut }> {
    // TODO(361): replace bespoke readOrCreate methods with base class's implementation.
    throw newUnimplementedError("doReadOrCreate is not implemented.");
  }

  async doUpdate(
    updatePersorg: UpdatePersorg,
    userId: EntityId,
    now: Date | Moment
  ) {
    const [doesConflict, hasPermission] = await Promise.all([
      this.persorgsDao.hasEquivalentPersorgs(updatePersorg),
      this.permissionsService.userHasPermission(userId, "EDIT_ANY_ENTITY"),
    ]);

    if (doesConflict) {
      throw new EntityConflictError({
        hasErrors: true,
        modelErrors: [entityConflictCodes.ALREADY_EXISTS],
      });
    }

    const persorg: PersorgData = await this.persorgsDao.readPersorgForId(
      updatePersorg.id
    );

    if (!hasPermission && persorg.creator && userId !== persorg.creator.id) {
      throw new AuthorizationError(
        makeModelErrors<UpdatePersorg>((p) =>
          p({
            message: "Lack permission to edit other users' persorgs",
            params: {
              code: authorizationErrorCodes.CANNOT_MODIFY_OTHER_USERS_ENTITIES,
            },
          })
        )
      );
    }

    const updatedPersorg = await this.persorgsDao.updatePersorg(
      updatePersorg,
      now
    );
    if (!updatedPersorg) {
      throw new EntityNotFoundError("PERSORG", updatePersorg.id);
    }
    return updatedPersorg;
  }

  async delete(userIdent: UserIdent, persorgId: EntityId) {
    const userId = await this.authService.readUserIdForUserIdent(userIdent);

    const source = await this.persorgsDao.readPersorgForId(persorgId);
    if (!source) {
      throw new EntityNotFoundError("SOURCE", persorgId);
    }

    await this.checkModifySourcePermission(userId, source);

    const deletedAt = utcNow();
    await this.mediaExcerptsDao.deleteMediaExcerptSpeakersForPersorgId(
      persorgId,
      deletedAt
    );
    await this.persorgsDao.deletePersorgForId(persorgId, deletedAt);
  }

  private async checkModifySourcePermission(
    userId: EntityId,
    persorg: PersorgOut
  ) {
    const hasEditPermission = await this.permissionsService.userHasPermission(
      userId,
      "EDIT_ANY_ENTITY"
    );
    if (hasEditPermission) {
      return;
    }

    if (persorg.creatorUserId !== userId) {
      throw new AuthorizationError(
        makeModelErrors<PersorgOut>((e) =>
          e("Only a Persorg's creator may edit it.")
        )
      );
    }
    // TODO(473) disallow deletes if other users have already depended on it.
    if (
      utcNow().isAfter(
        momentAdd(persorg.created, this.config.modifyEntityGracePeriod)
      )
    ) {
      throw new EntityTooOldToModifyError(this.config.modifyEntityGracePeriod);
    }
  }
}
