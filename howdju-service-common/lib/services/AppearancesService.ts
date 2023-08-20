import { concat, keyBy } from "lodash";

import {
  AppearanceOut,
  AppearanceSearchFilter,
  ContinuationToken,
  CreateAppearance,
  EntityId,
  isDefined,
  SortDescription,
  utcNow,
} from "howdju-common";

import { EntityWrapper } from "../types";
import { AppearancesDao } from "../daos";
import { AuthService } from "./AuthService";
import { MediaExcerptsService } from "./MediaExcerptsService";
import { readWriteReread } from "./patterns";
import { PropositionsService } from "./PropositionsService";
import { UsersService } from "./UsersService";
import { UserIdent } from "./types";
import { EntityNotFoundError, InvalidRequestError } from "..";
import { AppearanceConfirmationsService } from "../services";
import {
  createContinuationToken,
  createNextContinuationToken,
  decodeContinuationToken,
} from "./pagination";

export class AppearancesService {
  constructor(
    private readonly authService: AuthService,
    private readonly mediaExcerptsService: MediaExcerptsService,
    private readonly propositionsService: PropositionsService,
    private readonly appearanceConfirmationsService: AppearanceConfirmationsService,
    private readonly usersService: UsersService,
    private readonly appearancesDao: AppearancesDao
  ) {}

  async createAppearance(
    userIdent: UserIdent,
    createAppearance: CreateAppearance
  ): Promise<EntityWrapper<AppearanceOut>> {
    const userId = await this.authService.readUserIdForUserIdent(userIdent);

    const { mediaExcerptId } = createAppearance;
    const [
      mediaExcerpt,
      { propositionId, entity, isExtant: isExtantApparitionEntity },
      creator,
    ] = await Promise.all([
      this.mediaExcerptsService.readMediaExcerptForId(mediaExcerptId),
      this.readOrCreateApparition(userId, createAppearance.apparition),
      this.usersService.readUserBlurbForId(userId),
    ]);

    const created = utcNow();
    const { entity: id, isExtant: isExtantAppearance } = await readWriteReread(
      () =>
        this.appearancesDao.readEquivalentAppearanceId(userId, mediaExcerptId, {
          propositionId,
        }),
      () =>
        this.appearancesDao.createAppearanceReturningId(
          userId,
          mediaExcerptId,
          { propositionId },
          created
        )
    );

    await this.appearanceConfirmationsService.createAppearanceConfirmation(
      { userId },
      { appearanceId: id, polarity: "POSITIVE" }
    );

    const isExtant = isExtantApparitionEntity && isExtantAppearance;
    const appearance = {
      id,
      mediaExcerpt,
      apparition: {
        ...createAppearance.apparition,
        entity,
      },
      created,
      creator,
    };
    return { appearance, isExtant };
  }

  private async readOrCreateApparition(
    userId: EntityId,
    { type, entity: createEntity }: CreateAppearance["apparition"]
  ) {
    switch (type) {
      case "PROPOSITION": {
        const { isExtant, proposition } =
          await this.propositionsService.readOrCreateProposition(
            { userId },
            createEntity
          );
        return {
          entity: proposition,
          isExtant,
          propositionId: proposition.id,
        };
      }
    }
  }

  async readAppearanceForId(
    userIdent: UserIdent,
    appearanceId: EntityId
  ): Promise<AppearanceOut> {
    const [appearance] = await this.readAppearancesForIds(userIdent, [
      appearanceId,
    ]);
    return appearance;
  }

  async readAppearancesForIds(
    userIdent: UserIdent,
    appearanceIds: EntityId[]
  ): Promise<AppearanceOut[]> {
    const [appearances, userId] = await Promise.all([
      this.appearancesDao.readAppearancesForIds(appearanceIds),
      this.authService.readOptionalUserIdForUserIdent(userIdent),
    ]);
    const missingIds = appearances
      .map((a, i) => (!a ? appearanceIds[i] : undefined))
      .filter(isDefined);
    if (missingIds.length) {
      throw new EntityNotFoundError("APPEARANCE", missingIds);
    }

    const relatedIds = appearances.reduce(
      (acc, a) => {
        acc.mediaExcerptIds.add(a.mediaExcerptId);
        acc.propositionIds.add(a.propositionId);
        acc.creatorUserIds.add(a.creatorUserId);
        return acc;
      },
      {
        mediaExcerptIds: new Set<EntityId>(),
        propositionIds: new Set<EntityId>(),
        creatorUserIds: new Set<EntityId>(),
      }
    );

    const [mediaExcerpts, propositions, creators, confirmationStatuses] =
      await Promise.all([
        this.mediaExcerptsService.readMediaExcerptsForIds(
          Array.from(relatedIds.mediaExcerptIds)
        ),
        this.propositionsService.readPropositionsForIds(
          Array.from(relatedIds.propositionIds)
        ),
        this.usersService.readUserBlurbsForIds(
          Array.from(relatedIds.creatorUserIds)
        ),
        userId !== undefined
          ? this.appearanceConfirmationsService.readAppearanceConfirmationStatusesForAppearanceIds(
              userId,
              appearanceIds
            )
          : undefined,
      ]);
    const mediaExcerptsById = keyBy(mediaExcerpts, "id");
    const propositionsById = keyBy(propositions, "id");
    const creatorsById = keyBy(creators, "id");
    const confirmationStatusesByAppearanceId = confirmationStatuses
      ? keyBy(confirmationStatuses, "appearanceId")
      : undefined;

    return appearances.map(
      ({ id, mediaExcerptId, propositionId, creatorUserId, created }) => {
        const appearance: AppearanceOut = {
          id,
          mediaExcerpt: mediaExcerptsById[mediaExcerptId],
          apparition: {
            type: "PROPOSITION",
            entity: propositionsById[propositionId],
          },
          creator: creatorsById[creatorUserId],
          created,
        };
        if (confirmationStatusesByAppearanceId) {
          appearance.confirmationStatus =
            confirmationStatusesByAppearanceId[id]?.confirmationStatus ??
            undefined;
        }
        return appearance;
      }
    );
  }

  async readAppearances(
    filters: AppearanceSearchFilter | undefined,
    sorts: SortDescription[],
    continuationToken?: ContinuationToken,
    count = 25
  ) {
    if (!isFinite(count)) {
      throw new InvalidRequestError(
        `count must be a number. ${count} is not ${typeof count}.`
      );
    }

    if (!continuationToken) {
      return this.readInitialAppearances(filters, sorts, count);
    }
    return this.readMoreAppearances(continuationToken, count);
  }

  async readInitialAppearances(
    filters: AppearanceSearchFilter | undefined,
    sorts: SortDescription[],
    count: number
  ) {
    const unambiguousSorts = concat(sorts, [
      { property: "id", direction: "ascending" },
    ]);
    // TODO return the IDs and then read them. (Didn't we do this in another service recently too?)
    const appearances = await this.appearancesDao.readAppearances(
      filters,
      unambiguousSorts,
      count
    );

    const continuationToken = createContinuationToken(
      unambiguousSorts,
      appearances,
      filters
    ) as ContinuationToken;
    return {
      appearances,
      continuationToken,
    };
  }

  async readMoreAppearances(
    prevContinuationToken: ContinuationToken,
    count: number
  ) {
    const { filters, sorts } = decodeContinuationToken(prevContinuationToken);
    const appearances = await this.appearancesDao.readMoreAppearances(
      filters,
      sorts,
      count
    );

    const continuationToken =
      (createNextContinuationToken(
        sorts,
        appearances,
        filters
      ) as ContinuationToken) || prevContinuationToken;
    return {
      appearances,
      continuationToken,
    };
  }

  async readAppearancesWithOverlappingMediaExcerptsForUsers(
    userIdent: UserIdent,
    userIds: EntityId[],
    urlIds: EntityId[],
    sourceIds: EntityId[]
  ): Promise<AppearanceOut[]> {
    const appearanceIds =
      await this.appearancesDao.readOverlappingAppearanceIdsForUsers(
        userIds,
        urlIds,
        sourceIds
      );
    return this.readAppearancesForIds(userIdent, appearanceIds);
  }
}
