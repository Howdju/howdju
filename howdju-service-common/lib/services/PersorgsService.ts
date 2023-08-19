import moment, { Moment } from "moment";

import {
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
  EntityTooOldToModifyError,
} from "../serviceErrors";
import { persorgSchema } from "./validationSchemas";
import { PermissionsService } from "./PermissionsService";
import { AuthService } from "./AuthService";
import { EntityService } from "./EntityService";
import { PersorgsDao } from "../daos";
import { readWriteReread, updateHandlingConstraints } from "./patterns";
import { UserIdent } from "./types";
import { ApiConfig, UsersService } from "..";

export class PersorgsService extends EntityService<
  CreatePersorg,
  PersorgOut,
  UpdatePersorg,
  PersorgOut,
  "persorg"
> {
  constructor(
    private readonly config: ApiConfig,
    authService: AuthService,
    private readonly permissionsService: PermissionsService,
    private readonly usersService: UsersService,
    private readonly persorgsDao: PersorgsDao
  ) {
    super(persorgSchema, authService);
  }

  async readPersorgForId(persorgId: EntityId) {
    return await this.persorgsDao.readPersorgForId(persorgId);
  }

  readPersorgsForIds(persorgIds: EntityId[]) {
    return this.persorgsDao.readPersorgsForIds(persorgIds);
  }

  async readOrCreateValidPersorgAsUser(
    createPersorg: CreatePersorg,
    userId: EntityId,
    now: Moment
  ): Promise<{ isExtant: boolean; persorg: PersorgOut }> {
    const { entity: persorg, isExtant } = await readWriteReread(
      () => this.persorgsDao.readEquivalentPersorg(createPersorg),
      () => this.persorgsDao.createPersorg(createPersorg, userId, now)
    );
    const creatorUserId = isExtant ? persorg.creatorUserId : userId;
    const creator = await this.usersService.readUserBlurbForId(creatorUserId);
    return {
      isExtant,
      persorg: { ...persorg, creator },
    };
  }

  async readOrCreatePersorgs(
    userId: EntityId,
    createPersorgs: CreatePersorg[],
    created: Moment
  ) {
    const result = await Promise.all(
      createPersorgs.map((p) =>
        this.readOrCreateValidPersorgAsUser(p, userId, created)
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

  async doUpdate(updatePersorg: UpdatePersorg, userId: EntityId, now: Moment) {
    // TODO(361) remove
    now = moment.isMoment(now) ? now : moment(now);
    const persorg = await this.persorgsDao.readPersorgForId(updatePersorg.id);
    if (!persorg) {
      throw new EntityNotFoundError("PERSORG", updatePersorg.id);
    }

    const hasPermission = await this.permissionsService.userHasPermission(
      userId,
      "EDIT_ANY_ENTITY"
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

    return await updateHandlingConstraints(
      updatePersorg,
      (p) => this.persorgsDao.updatePersorg(p, now) as Promise<PersorgOut>,
      [
        {
          test: (persorg, detail) =>
            persorg.isOrganization && detail.includes("normal_name"),
          errors: makeModelErrors((e) =>
            e.name("An organization with that name already exists.")
          ),
        },
        {
          test: (persorg, detail) =>
            !persorg.isOrganization && detail.includes("normal_name"),
          errors: makeModelErrors(
            (e) =>
              e.name("A person with that name and known for already exist."),
            (e) =>
              e.knownFor("A person with that name and known for already exist.")
          ),
        },
      ]
    );
  }

  async delete(userIdent: UserIdent, persorgId: EntityId) {
    const userId = await this.authService.readUserIdForUserIdent(userIdent);

    const source = await this.persorgsDao.readPersorgForId(persorgId);
    if (!source) {
      throw new EntityNotFoundError("SOURCE", persorgId);
    }

    await this.checkModifyPermission(userId, source);

    const deletedAt = utcNow();
    await this.persorgsDao.deletePersorgForId(persorgId, deletedAt);
  }

  private async checkModifyPermission(userId: EntityId, persorg: PersorgOut) {
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
