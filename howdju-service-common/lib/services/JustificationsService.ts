import moment, { Moment } from "moment";

import concat from "lodash/concat";
import every from "lodash/every";
import filter from "lodash/filter";
import get from "lodash/get";
import isFinite from "lodash/isFinite";
import join from "lodash/join";
import map from "lodash/map";
import partition from "lodash/partition";
import toNumber from "lodash/toNumber";

import {
  JustificationBasisTypes,
  isTruthy,
  JustificationTargetTypes,
  authorizationErrorCodes,
  ActionTypes,
  ActionTargetTypes,
  newImpossibleError,
  idEqual,
  requireArgs,
  newExhaustedEnumError,
  CreateJustification,
  Justification,
  EntityId,
  JustificationOut,
  ContinuationToken,
  JustificationSearchFilters,
  JustificationRootTargetType,
  AuthToken,
  Logger,
  SortDescription,
  newUnimplementedError,
  CreateJustificationTarget,
  CreateJustificationBasis,
  utcNow,
  toJson,
  PropositionOut,
  StatementOut,
  PropositionCompoundOut,
  WritQuoteOut,
  makeModelErrors,
  JustificationWithRootOut,
  PersistedEntity,
  isBareRef,
} from "howdju-common";

import { ApiConfig } from "../config";
import { EntityService } from "./EntityService";
import {
  createContinuationToken,
  decodeContinuationToken,
  createNextContinuationToken,
} from "./pagination";
import { permissions } from "../permissions";
import {
  RequestValidationError,
  EntityTooOldToModifyError,
  UnauthorizedError,
  EntityNotFoundError,
} from "../serviceErrors";
import { prefixErrorPath } from "../util";
import { ActionsService } from "./ActionsService";
import {
  AuthService,
  JustificationBasisCompoundsService,
  JustificationsDao,
  MediaExcerptsService,
  PermissionsDao,
  PropositionCompoundsService,
  PropositionsService,
  StatementsService,
  WritQuotesService,
} from "..";
import {
  CreateJustificationDataIn,
  JustificationRootTargetData,
  ReadJustificationDataOut,
} from "../daos/dataTypes";
import { toIdString } from "../daos/daosUtil";

export class JustificationsService extends EntityService<
  CreateJustification,
  JustificationOut,
  never,
  JustificationOut,
  "justification"
> {
  config: ApiConfig;
  logger: Logger;
  actionsService: ActionsService;
  authService: AuthService;
  propositionsService: PropositionsService;
  statementsService: StatementsService;
  writQuotesService: WritQuotesService;
  propositionCompoundsService: PropositionCompoundsService;
  mediaExcerptsService: MediaExcerptsService;
  justificationBasisCompoundsService: JustificationBasisCompoundsService;
  justificationsDao: JustificationsDao;
  permissionsDao: PermissionsDao;

  constructor(
    config: ApiConfig,
    logger: Logger,
    actionsService: ActionsService,
    authService: AuthService,
    propositionsService: PropositionsService,
    statementsService: StatementsService,
    writQuotesService: WritQuotesService,
    propositionCompoundsService: PropositionCompoundsService,
    mediaExcerptsService: MediaExcerptsService,
    justificationBasisCompoundsService: JustificationBasisCompoundsService,
    justificationsDao: JustificationsDao,
    permissionsDao: PermissionsDao
  ) {
    super({ createSchema: CreateJustification }, authService);
    requireArgs({
      config,
      logger,
      actionsService,
      authService,
      propositionsService,
      statementsService,
      writQuotesService,
      propositionCompoundsService,
      mediaExcerptsService,
      justificationBasisCompoundsService,
      justificationsDao,
      permissionsDao,
    });
    this.config = config;
    this.logger = logger;
    this.actionsService = actionsService;
    this.authService = authService;
    this.propositionsService = propositionsService;
    this.statementsService = statementsService;
    this.writQuotesService = writQuotesService;
    this.propositionCompoundsService = propositionCompoundsService;
    this.mediaExcerptsService = mediaExcerptsService;
    this.justificationBasisCompoundsService =
      justificationBasisCompoundsService;
    this.justificationsDao = justificationsDao;
    this.permissionsDao = permissionsDao;
  }

  async readJustifications({
    filters,
    sorts,
    continuationToken = undefined,
    count = 25,
    includeUrls = false,
  }: {
    filters: JustificationSearchFilters;
    sorts: SortDescription[];
    continuationToken: ContinuationToken | undefined;
    count: number;
    includeUrls: boolean;
  }): Promise<{
    justifications: JustificationOut[];
    continuationToken: ContinuationToken;
  }> {
    const countNumber = toNumber(count);
    if (!isFinite(countNumber)) {
      throw new RequestValidationError(
        `count must be a number. ${count} is not a number.`
      );
    }
    if (filters && filter(filters).length > 1) {
      throw new RequestValidationError(
        "Only one filter is supported because justifications have one basis."
      );
    }

    if (!continuationToken) {
      return this.readInitialJustifications(
        filters,
        sorts,
        countNumber,
        includeUrls
      );
    }
    return this.readMoreJustifications(
      continuationToken,
      countNumber,
      includeUrls
    );
  }

  private async readInitialJustifications(
    filters: JustificationSearchFilters,
    requestedSorts: SortDescription[],
    count: number,
    includeUrls: boolean
  ): Promise<{
    justifications: JustificationOut[];
    continuationToken: ContinuationToken;
  }> {
    const disambiguationSorts: SortDescription[] = [
      { property: "id", direction: "ascending" },
    ];
    const unambiguousSorts = concat(requestedSorts, disambiguationSorts);
    const justifications = await this.justificationsDao.readJustifications(
      filters,
      unambiguousSorts,
      count,
      false,
      includeUrls
    );
    const continuationToken = createContinuationToken(
      unambiguousSorts,
      justifications,
      filters
    );
    return {
      justifications,
      continuationToken,
    };
  }

  private async readMoreJustifications(
    continuationToken: ContinuationToken,
    count: number,
    includeUrls: boolean
  ): Promise<{
    justifications: JustificationOut[];
    continuationToken: ContinuationToken;
  }> {
    const { sorts, filters } = decodeContinuationToken(continuationToken);
    const justifications = await this.justificationsDao.readJustifications(
      filters,
      sorts,
      count,
      true,
      includeUrls
    );
    this.validateJustifications(justifications);
    const nextContinuationToken =
      createNextContinuationToken(sorts, justifications, filters) ||
      continuationToken;
    return {
      justifications,
      continuationToken: nextContinuationToken,
    };
  }

  async readJustificationsForRootTarget(
    rootTargetType: JustificationRootTargetType,
    rootTargetId: EntityId,
    userId: EntityId | undefined
  ) {
    return await this.justificationsDao.readJustificationsForRootTarget(
      rootTargetType,
      rootTargetId,
      userId
    );
  }

  protected async doReadOrCreate(
    justification: CreateJustification,
    userId: EntityId,
    now: Moment
  ): Promise<{ isExtant: boolean; justification: JustificationOut }> {
    return await this.readOrCreateEquivalentValidJustificationAsUser(
      justification,
      userId,
      now
    );
  }

  async readJustificationForId(
    justificationId: EntityId,
    userId: EntityId | undefined
  ): Promise<JustificationWithRootOut> {
    const justificationData =
      await this.justificationsDao.readJustificationForId(justificationId);
    if (!justificationData) {
      throw new EntityNotFoundError("JUSTIFICATION", justificationId);
    }

    const [rootTargetInfo, targetInfo, basisInfo] = await Promise.all([
      this.readRootTargetInfo(justificationData, userId),
      this.readJustificationTargetInfo(justificationData.target, { userId }),
      this.readJustificationBasisInfo(justificationData.basis),
    ]);
    const justification = {
      ...justificationData,
      ...rootTargetInfo,
      ...{
        target: targetInfo,
      },
      ...{ basis: basisInfo },
    };
    this.logTargetInconsistency(justification);
    return justification;
  }

  protected doUpdate() {
    return Promise.reject(
      newUnimplementedError("Cannot update justifications.")
    );
  }

  async deleteJustification(authToken: AuthToken, justificationId: EntityId) {
    const userId = await this.authService.readUserIdForAuthToken(authToken);

    const [hasPermission, justification] = await Promise.all([
      this.permissionsDao.userHasPermission(
        userId,
        permissions.EDIT_ANY_ENTITY
      ),
      this.justificationsDao.readJustificationForId(justificationId),
    ]);

    if (!justification) {
      throw new EntityNotFoundError("JUSTIFICATION", justificationId);
    }

    const now = utcNow();

    if (!hasPermission) {
      const creatorUserId = get(justification, "creator.id");
      if (!creatorUserId || userId !== creatorUserId) {
        throw new UnauthorizedError(
          makeModelErrors<Justification>((j) =>
            j({
              message: "Cannot delete other user's justifications.",
              params: {
                code: authorizationErrorCodes.CANNOT_MODIFY_OTHER_USERS_ENTITIES,
              },
            })
          )
        );
      }

      const created = moment(justification.created);
      const graceCutoff = created.clone();
      graceCutoff.add(this.config.modifyEntityGracePeriod);
      const nowMoment = moment(now);
      if (nowMoment.isAfter(graceCutoff)) {
        throw new EntityTooOldToModifyError(
          this.config.modifyEntityGracePeriod
        );
      }
    }

    const deletedCounterJustificationIds =
      await this.deleteCounterJustificationsToJustificationIds(
        [justification.id],
        userId,
        now
      );
    deletedCounterJustificationIds.forEach((id) =>
      this.actionsService.asyncRecordAction(
        userId,
        now,
        ActionTypes.DELETE,
        ActionTargetTypes.JUSTIFICATION,
        id
      )
    );

    const deletedJustificationId =
      await this.justificationsDao.deleteJustification(justification, now);
    if (!deletedJustificationId) {
      throw newImpossibleError(
        `Failed to delete justification by ID (${justificationId} but we were able to read it: ${toJson(
          justification
        )}`
      );
    }

    await this.actionsService.recordAction(
      userId,
      now,
      ActionTypes.DELETE,
      ActionTargetTypes.JUSTIFICATION,
      deletedJustificationId
    );

    return {
      deletedJustificationId,
      deletedCounterJustificationIds,
    };
  }

  private logTargetInconsistency(justification: Justification) {
    if (
      justification.target.type !== JustificationTargetTypes.JUSTIFICATION &&
      !(
        idEqual(justification.rootTarget.id, justification.target.entity.id) ||
        justification.rootTargetType !== justification.target.type
      )
    ) {
      this.logger.error(
        `Justification ${justification.id} targets ${justification.target.type}` +
          ` ${justification.target.entity.id} but has inconsistent root target ${justification.rootTargetType} ${justification.rootTarget.id}`
      );
    }
  }

  private async deleteCounterJustificationsToJustificationIds(
    justificationIds: EntityId[],
    userId: EntityId,
    now: Moment,
    deletedJustificationIds: EntityId[] = []
  ): Promise<EntityId[]> {
    if (justificationIds.length === 0) {
      return deletedJustificationIds;
    }
    const newDeletedJustificationIds = (
      await this.justificationsDao.deleteCounterJustificationsToJustificationIds(
        justificationIds,
        now
      )
    ).map(toIdString);
    return await this.deleteCounterJustificationsToJustificationIds(
      newDeletedJustificationIds,
      userId,
      now,
      deletedJustificationIds.concat(newDeletedJustificationIds)
    );
  }

  private async readRootTargetInfo(
    justification: {
      rootTargetType: JustificationRootTargetType;
      rootTarget: { id: EntityId };
    },
    userId: EntityId | undefined
  ) {
    switch (justification.rootTargetType) {
      case "PROPOSITION": {
        const rootTarget = await this.propositionsService.readPropositionForId(
          justification.rootTarget.id,
          { userId, authToken: undefined }
        );
        return { rootTarget, rootTargetType: "PROPOSITION" as const };
      }
      case "STATEMENT": {
        const rootTarget = await this.statementsService.readStatementForId(
          { userId },
          justification.rootTarget.id
        );
        return { rootTarget, rootTargetType: "STATEMENT" as const };
      }
    }
  }

  private async readJustificationTargetInfo(
    justificationTarget:
      | {
          type: "PROPOSITION";
          entity: PersistedEntity;
        }
      | {
          type: "STATEMENT";
          entity: PersistedEntity;
        }
      | {
          type: "JUSTIFICATION";
          entity: PersistedEntity;
        },
    { userId }: { userId: EntityId | undefined }
  ) {
    switch (justificationTarget.type) {
      case "PROPOSITION": {
        const entity = await this.propositionsService.readPropositionForId(
          justificationTarget.entity.id,
          { userId, authToken: undefined }
        );
        return {
          type: "PROPOSITION" as const,
          entity,
        };
      }

      case "STATEMENT": {
        const entity = await this.statementsService.readStatementForId(
          { userId },
          justificationTarget.entity.id
        );
        return {
          type: "STATEMENT" as const,
          entity,
        };
      }

      case "JUSTIFICATION": {
        const entity = await this.readJustificationForId(
          justificationTarget.entity.id,
          userId
        );
        return {
          type: "JUSTIFICATION" as const,
          entity,
        };
      }
    }
  }

  private async readJustificationBasisInfo(
    justificationBasis: ReadJustificationDataOut["basis"]
  ) {
    switch (justificationBasis.type) {
      case "WRIT_QUOTE": {
        const entity = await this.writQuotesService.readWritQuoteForId(
          justificationBasis.entity.id
        );
        return {
          type: "WRIT_QUOTE" as const,
          entity,
        };
      }
      case "PROPOSITION_COMPOUND": {
        const entity =
          await this.propositionCompoundsService.readPropositionCompoundForId(
            justificationBasis.entity.id
          );
        return {
          type: "PROPOSITION_COMPOUND" as const,
          entity,
        };
      }
      case "MEDIA_EXCERPT": {
        const entity = await this.mediaExcerptsService.readMediaExcerptForId(
          justificationBasis.entity.id
        );
        return {
          type: "MEDIA_EXCERPT" as const,
          entity,
        };
      }
      case "JUSTIFICATION_BASIS_COMPOUND":
        return {
          type: "JUSTIFICATION_BASIS_COMPOUND" as const,
          entity: justificationBasis.entity,
        };
    }
  }

  private async readOrCreateEquivalentValidJustificationAsUser(
    createJustification: CreateJustification,
    userId: EntityId,
    now: Moment
  ): Promise<{ isExtant: boolean; justification: JustificationOut }> {
    const [{ target }, { basis }] = await Promise.all([
      prefixErrorPath(
        this.readOrCreateJustificationTarget(
          createJustification.target,
          userId,
          now
        ),
        "target"
      ),
      prefixErrorPath(
        this.readOrCreateJustificationBasis(
          createJustification.basis,
          userId,
          now
        ),
        "basis"
      ),
    ]);

    const rootTargetStuff = extractRootTargetStuff(target);

    const createJustificationDataIn: CreateJustificationDataIn = {
      ...createJustification,
      ...rootTargetStuff,
      target,
      basis,
    };
    const equivalentJustification =
      await this.justificationsDao.readJustificationEquivalentTo(
        createJustificationDataIn
      );
    const isExtant = !!equivalentJustification;
    const persistedJustification =
      equivalentJustification ??
      (await this.justificationsDao.createJustification(
        createJustificationDataIn,
        userId,
        now
      ));

    const actionType = isExtant
      ? ActionTypes.TRY_CREATE_DUPLICATE
      : ActionTypes.CREATE;
    await this.actionsService.recordAction(
      userId,
      now,
      actionType,
      ActionTargetTypes.JUSTIFICATION,
      persistedJustification.id
    );

    const justificationDataOut: ReadJustificationDataOut = {
      ...persistedJustification,
      ...{ basis, target },
      counterJustifications: [],
    };
    return {
      isExtant,
      justification: {
        ...justificationDataOut,
        target,
        basis,
      },
    };
  }

  private async readOrCreateJustificationTarget(
    justificationTarget: CreateJustificationTarget,
    userId: EntityId,
    now: Moment
  ) {
    const type = justificationTarget.type;
    switch (type) {
      case "PROPOSITION": {
        // TODO(452) remove CreateProposition.id and use `"id" in createPropositionTagVote.proposition`
        // instead (and switch the conditonal blocks)
        if ("text" in justificationTarget.entity) {
          const { isExtant, proposition } = await prefixErrorPath(
            this.propositionsService.readOrCreatePropositionAsUser(
              justificationTarget.entity,
              userId,
              now
            ) as Promise<{ isExtant: boolean; proposition: PropositionOut }>,
            "entity"
          );
          return {
            isExtant,
            target: { type, entity: proposition },
          };
        }
        const proposition = await this.propositionsService.readPropositionForId(
          justificationTarget.entity.id,
          { userId, authToken: undefined }
        );
        return {
          isExtant: true,
          target: { type, entity: proposition },
        };
      }

      case "STATEMENT": {
        // TODO(452) remove CreateStatement.id and use `"id" in createPropositionTagVote.proposition`
        // instead (and switch the conditonal blocks)
        if ("sentence" in justificationTarget.entity) {
          const { isExtant, statement } = await prefixErrorPath(
            this.statementsService.doReadOrCreate(
              justificationTarget.entity,
              userId,
              now
            ) as Promise<{ isExtant: boolean; statement: StatementOut }>,
            "entity"
          );
          return {
            isExtant,
            target: { type, entity: statement },
          };
        }
        const statement = await this.statementsService.readStatementForId(
          { userId },
          justificationTarget.entity.id
        );
        return {
          isExtant: true,
          target: { type, entity: statement },
        };
      }

      case "JUSTIFICATION": {
        if ("target" in justificationTarget.entity) {
          const { isExtant, justification } = await prefixErrorPath(
            this.doReadOrCreate(justificationTarget.entity, userId, now),
            "entity"
          );
          return {
            isExtant,
            target: { type, entity: justification },
          };
        }
        const justification = await this.readJustificationForId(
          justificationTarget.entity.id,
          userId
        );
        return {
          isExtant: true,
          target: { type, entity: justification },
        };
      }

      default:
        throw newExhaustedEnumError(justificationTarget);
    }
  }

  private async readOrCreateJustificationBasis(
    justificationBasis: CreateJustificationBasis,
    userId: EntityId,
    now: Moment
  ) {
    const type = justificationBasis.type;
    switch (type) {
      case JustificationBasisTypes.WRIT_QUOTE: {
        const { isExtant, writQuote } = await prefixErrorPath(
          this.writQuotesService.readOrCreateWritQuoteAsUser(
            justificationBasis.entity,
            userId,
            now
          ) as Promise<{ isExtant: boolean; writQuote: WritQuoteOut }>,
          "entity"
        );
        return {
          isExtant,
          basis: { type, entity: writQuote },
        };
      }

      case JustificationBasisTypes.PROPOSITION_COMPOUND: {
        if (isBareRef(justificationBasis.entity)) {
          const propositionCompound =
            await this.propositionCompoundsService.readPropositionCompoundForId(
              justificationBasis.entity.id
            );
          return {
            isExtant: true,
            basis: { type, entity: propositionCompound },
          };
        }
        const { isExtant, propositionCompound } = await prefixErrorPath(
          this.propositionCompoundsService.createValidPropositionCompoundAsUser(
            justificationBasis.entity,
            userId,
            now
          ) as Promise<{
            isExtant: boolean;
            propositionCompound: PropositionCompoundOut;
          }>,
          "entity"
        );
        return {
          isExtant,
          basis: { type, entity: propositionCompound },
        };
      }

      case "MEDIA_EXCERPT": {
        if (isBareRef(justificationBasis.entity)) {
          const mediaExcerpt = await prefixErrorPath(
            this.mediaExcerptsService.readMediaExcerptForId(
              justificationBasis.entity.id
            ),
            "entity"
          );
          return {
            isExtant: true,
            basis: { type, entity: mediaExcerpt },
          };
        }

        const { isExtant, mediaExcerpt } = await prefixErrorPath(
          this.mediaExcerptsService.readOrCreateMediaExcerpt(
            { userId },
            justificationBasis.entity
          ),
          "entity"
        );
        return {
          isExtant,
          basis: { type, entity: mediaExcerpt },
        };
      }

      case "SOURCE_EXCERPT":
        // TODO(201): remove
        throw newUnimplementedError(
          "SourceExcerpt bases are not yet implemented."
        );

      default:
        throw newExhaustedEnumError(justificationBasis);
    }
  }

  private validateJustifications(justifications: ReadJustificationDataOut[]) {
    const [goodJustifications, badJustifications] = partition(
      justifications,
      (j) =>
        j.basis.type !== JustificationBasisTypes.PROPOSITION_COMPOUND ||
        ("atoms" in j.basis.entity &&
          j.basis.entity.atoms &&
          j.basis.entity.atoms.length > 0 &&
          every(j.basis.entity.atoms, (a) => isTruthy(a.entity.id)))
    );
    if (badJustifications.length > 0) {
      this.logger.error(
        `these justifications have invalid proposition compounds: ${join(
          map(badJustifications, (j) => j.id),
          ", "
        )}`
      );
      this.logger.error(badJustifications);
    }
    return goodJustifications;
  }
}

function extractRootTargetStuff(
  target:
    | {
        type: "PROPOSITION";
        entity: PropositionOut;
      }
    | {
        type: "STATEMENT";
        entity: StatementOut;
      }
    | {
        type: "JUSTIFICATION";
        entity: JustificationOut;
      }
): JustificationRootTargetData {
  switch (target.type) {
    case "PROPOSITION":
    case "STATEMENT":
      // TODO(151) remove typecast after updating rootTarget to be a discriminated union field
      return {
        rootTargetType: target.type,
        rootTarget: target.entity,
      } as JustificationRootTargetData;
    case "JUSTIFICATION":
      // TODO(151) remove typecast after updating rootTarget to be a discriminated union field
      return {
        rootTarget: target.entity.rootTarget,
        rootTargetType: target.entity.rootTargetType,
      } as JustificationRootTargetData;
    default:
      throw newExhaustedEnumError(target);
  }
}
