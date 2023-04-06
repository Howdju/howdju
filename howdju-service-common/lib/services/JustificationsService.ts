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
import { merge } from "lodash";

import {
  JustificationBasisTypes,
  isTruthy,
  JustificationRootTargetTypes,
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
  JustificationTarget,
  JustificationBasis,
  PersistOrRef,
  newUnimplementedError,
  CreateJustificationTarget,
  CreateJustificationBasis,
  utcNow,
  toJson,
  PropositionOut,
  EntityRef,
  isRef,
  StatementOut,
  PropositionCompoundOut,
  WritQuoteOut,
  makeModelErrors,
  JustificationView,
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
  AuthorizationError,
  EntityNotFoundError,
} from "../serviceErrors";
import { prefixErrorPath } from "../util";
import { ActionsService } from "./ActionsService";
import {
  AuthService,
  JustificationBasisCompoundsService,
  JustificationsDao,
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
    justificationBasisCompoundsService: JustificationBasisCompoundsService,
    justificationsDao: JustificationsDao,
    permissionsDao: PermissionsDao
  ) {
    super({ createSchema: CreateJustification }, logger, authService);
    requireArgs({
      config,
      logger,
      actionsService,
      authService,
      propositionsService,
      statementsService,
      writQuotesService,
      propositionCompoundsService,
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
    continuationToken: ContinuationToken | undefined;
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
    continuationToken: ContinuationToken | undefined;
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
    userId: EntityId
  ) {
    return await this.justificationsDao.readJustificationsForRootTarget(
      rootTargetType,
      rootTargetId,
      userId
    );
  }

  protected async doReadOrCreate(
    justification: CreateJustification | EntityRef<Justification>,
    userId: EntityId,
    now: Moment
  ): Promise<{ isExtant: boolean; justification: JustificationOut }> {
    if (justification.id) {
      return {
        isExtant: true,
        justification: await this.readJustificationForId(
          justification.id,
          userId
        ),
      };
    }
    if (isRef(justification)) {
      throw newImpossibleError(
        "The justification can't be a ref if its id was falsy."
      );
    }

    return await this.readOrCreateEquivalentValidJustificationAsUser(
      justification,
      userId,
      now
    );
  }

  async readJustificationForId(
    justificationId: EntityId,
    userId: EntityId
  ): Promise<JustificationView> {
    const justificationData =
      await this.justificationsDao.readJustificationForId(justificationId);
    if (!justificationData) {
      throw new EntityNotFoundError("JUSTIFICATION", justificationId);
    }

    const [rootTarget, targetEntity, basisEntity] = await Promise.all([
      this.readRootTarget(justificationData, userId),
      this.readJustificationTarget(justificationData.target, { userId }),
      this.readJustificationBasis(justificationData.basis),
    ]);
    const justification = merge(
      {},
      justificationData,
      { rootTarget },
      {
        target: {
          entity: targetEntity,
        },
      },
      { basis: { entity: basisEntity } }
    );
    this.logTargetInconsistency(justification);
    return justification;
  }

  protected doUpdate() {
    return Promise.reject(
      newUnimplementedError("Cannot update justifications.")
    );
  }

  async deleteJustification(
    authToken: AuthToken | undefined,
    justificationId: EntityId
  ) {
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
        throw new AuthorizationError(
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

    this.actionsService.asyncRecordAction(
      userId,
      now,
      ActionTypes.DELETE,
      ActionTargetTypes.JUSTIFICATION,
      toIdString(deletedJustificationId)
    );

    return {
      deletedJustificationId: toIdString(deletedJustificationId),
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

  private async readRootTarget(
    justification: {
      rootTargetType: JustificationRootTargetType;
      rootTarget: { id: EntityId };
    },
    userId: EntityId
  ) {
    switch (justification.rootTargetType) {
      case JustificationRootTargetTypes.PROPOSITION:
        return this.propositionsService.readPropositionForId(
          justification.rootTarget.id,
          { userId, authToken: undefined }
        );
      case JustificationRootTargetTypes.STATEMENT:
        return this.statementsService.readStatementForId(
          justification.rootTarget.id
        );
      default:
        throw newImpossibleError(
          `Exhausted JustificationRootTargetTypes: ${justification}`
        );
    }
  }

  private async readJustificationTarget(
    justificationTarget: PersistOrRef<JustificationTarget>,
    { userId }: { userId: EntityId }
  ) {
    switch (justificationTarget.type) {
      case "PROPOSITION":
        return await this.propositionsService.readPropositionForId(
          justificationTarget.entity.id,
          { userId, authToken: undefined }
        );

      case "STATEMENT":
        return await this.statementsService.readStatementForId(
          justificationTarget.entity.id
        );

      case "JUSTIFICATION":
        return await this.readJustificationForId(
          justificationTarget.entity.id,
          userId
        );

      default:
        throw newExhaustedEnumError(justificationTarget);
    }
  }

  private async readJustificationBasis(
    justificationBasis: PersistOrRef<JustificationBasis>
  ) {
    switch (justificationBasis.type) {
      case "WRIT_QUOTE":
        return await this.writQuotesService.readWritQuoteForId(
          justificationBasis.entity.id
        );

      case "PROPOSITION_COMPOUND":
        return await this.propositionCompoundsService.readPropositionCompoundForId(
          justificationBasis.entity.id
        );
      case "SOURCE_EXCERPT":
        // TODO(201): implement
        throw newUnimplementedError(
          "SOURCE_EXCERPT justifciation bases are not yet supported"
        );

      default:
        throw newExhaustedEnumError(justificationBasis);
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
    this.actionsService.asyncRecordAction(
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
        const { isExtant, proposition } = await prefixErrorPath(
          this.propositionsService.readOrCreateValidPropositionAsUser(
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

      case "STATEMENT": {
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

      case "JUSTIFICATION": {
        const { isExtant, justification } = await prefixErrorPath(
          this.doReadOrCreate(justificationTarget.entity, userId, now),
          "entity"
        );
        return {
          isExtant,
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
        // TODO update to readOrCreatePropositionCompoundAsUser
        const { isExtant, propositionCompound } = await prefixErrorPath(
          this.propositionCompoundsService.createPropositionCompoundAsUser(
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

      case "SOURCE_EXCERPT":
        // TODO(201): implement
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
