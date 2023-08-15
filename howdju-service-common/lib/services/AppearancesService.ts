import {
  AppearanceOut,
  CreateAppearance,
  EntityId,
  isDefined,
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
import { EntityNotFoundError } from "..";
import { keyBy } from "lodash";

export class AppearancesService {
  constructor(
    private readonly authService: AuthService,
    private readonly mediaExcerptsService: MediaExcerptsService,
    private readonly propositionsService: PropositionsService,
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

  async readAppearanceForId(appearanceId: EntityId): Promise<AppearanceOut> {
    const [appearance] = await this.readAppearanceForIds([appearanceId]);
    return appearance;
  }

  async readAppearanceForIds(
    appearanceIds: EntityId[]
  ): Promise<AppearanceOut[]> {
    const appearances = await this.appearancesDao.readAppearanceForIds(
      appearanceIds
    );
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

    const [mediaExcerpts, propositions, creators] = await Promise.all([
      this.mediaExcerptsService.readMediaExcerptForIds(
        Array.from(relatedIds.mediaExcerptIds)
      ),
      this.propositionsService.readPropositionsForIds(
        Array.from(relatedIds.propositionIds)
      ),
      this.usersService.readUserBlurbsForIds(
        Array.from(relatedIds.creatorUserIds)
      ),
    ]);
    const mediaExcerptsById = keyBy(mediaExcerpts, "id");
    const propositionsById = keyBy(propositions, "id");
    const creatorsById = keyBy(creators, "id");

    return appearances.map(
      ({ id, mediaExcerptId, propositionId, creatorUserId, created }) => ({
        id,
        mediaExcerpt: mediaExcerptsById[mediaExcerptId],
        apparition: {
          type: "PROPOSITION",
          entity: propositionsById[propositionId],
        },
        creator: creatorsById[creatorUserId],
        created,
      })
    );
  }

  async readAppearancesWithOverlappingMediaExcerptsForUsers(
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
    return this.readAppearanceForIds(appearanceIds);
  }
}
