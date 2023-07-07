import { Moment } from "moment";

import {
  entityConflictCodes,
  Logger,
  EntityId,
  CreatePersorg,
  UpdatePersorg,
  PersorgOut,
  makeModelErrors,
  authorizationErrorCodes,
  newUnimplementedError,
} from "howdju-common";

import { permissions } from "../permissions";
import {
  AuthorizationError,
  EntityNotFoundError,
  EntityConflictError,
} from "../serviceErrors";
import { persorgSchema } from "./validationSchemas";
import { PermissionsService } from "./PermissionsService";
import { AuthService } from "./AuthService";
import { EntityService } from "./EntityService";
import { PersorgData, PersorgsDao } from "../daos";
import { readWriteReread } from "./patterns";

export class PersorgsService extends EntityService<
  CreatePersorg,
  PersorgOut,
  UpdatePersorg,
  PersorgOut,
  "persorg"
> {
  logger: Logger;
  permissionsService: PermissionsService;
  persorgsDao: PersorgsDao;
  constructor(
    logger: Logger,
    authService: AuthService,
    permissionsService: PermissionsService,
    persorgsDao: PersorgsDao
  ) {
    super(persorgSchema, logger, authService);
    this.logger = logger;
    this.permissionsService = permissionsService;
    this.persorgsDao = persorgsDao;
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
    const permission = permissions.EDIT_ANY_ENTITY;
    const [doesConflict, hasPermission] = await Promise.all([
      this.persorgsDao.hasEquivalentPersorgs(updatePersorg),
      this.permissionsService.userHasPermission(userId, permission),
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

    if (!hasPermission || !persorg.creator || userId !== persorg.creator.id) {
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
}
