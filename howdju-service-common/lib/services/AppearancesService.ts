import {
  AppearanceOut,
  CreateAppearance,
  EntityId,
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
      this.usersService.readCreatorInfoForId(userId),
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

  async readAppearanceForId(
    userIdent: UserIdent,
    appearanceId: EntityId
  ): Promise<AppearanceOut> {
    const appearance = await this.appearancesDao.readAppearanceForId(
      appearanceId
    );
    if (!appearance) {
      throw new EntityNotFoundError("APPEARANCE", appearanceId);
    }
    const { mediaExcerptId, propositionId, creatorUserId, created } =
      appearance;
    const [mediaExcerpt, apparition, creator] = await Promise.all([
      this.mediaExcerptsService.readMediaExcerptForId(mediaExcerptId),
      this.readApparition(userIdent, { propositionId }),
      this.usersService.readCreatorInfoForId(creatorUserId),
    ]);

    return {
      id: appearanceId,
      mediaExcerpt,
      apparition,
      creator,
      created,
    };
  }

  private async readApparition(
    userIdent: UserIdent,
    { propositionId }: { propositionId: EntityId }
  ): Promise<AppearanceOut["apparition"]> {
    return {
      type: "PROPOSITION",
      entity: await this.propositionsService.readPropositionForId(
        propositionId,
        userIdent
      ),
    };
  }
}
