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
import { UserIdent } from "./types";

export class AppearancesService {
  constructor(
    private readonly authService: AuthService,
    private readonly mediaExcerptsService: MediaExcerptsService,
    private readonly propositionsService: PropositionsService,
    private readonly appearancesDao: AppearancesDao
  ) {}

  async createAppearance(
    userIdent: UserIdent,
    createAppearance: CreateAppearance
  ): Promise<EntityWrapper<AppearanceOut>> {
    const userId = await this.authService.readUserIdForUserIdent(userIdent);

    const { mediaExcerptId } = createAppearance;
    const mediaExcerpt = await this.mediaExcerptsService.readMediaExcerptForId(
      mediaExcerptId
    );
    const {
      propositionId,
      entity,
      isExtant: isExtantApparitionEntity,
    } = await this.readOrCreateApparition(userId, createAppearance.apparition);

    const createdAt = utcNow();
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
          createdAt
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
}
