import { zip } from "lodash";

import {
  AuthToken,
  TrailConnection,
  ContextTrailItemInfo,
  Logger,
  areAdjacentConnectingEntities,
  toJson,
  newImpossibleError,
  RelationPolarity,
  contextTrailItemPolarity,
  ContextTrailItemOut,
} from "howdju-common";

import {
  AppearancesService,
  AuthService,
  ConflictError,
  InvalidRequestError,
  JustificationsService,
} from "..";

export class ContextTrailsService {
  constructor(
    private readonly logger: Logger,
    private readonly authService: AuthService,
    private readonly justificationsService: JustificationsService,
    private readonly appearancesService: AppearancesService
  ) {}

  async readContextTrail(
    authToken: AuthToken | undefined,
    contextTrailInfos: ContextTrailItemInfo[]
  ): Promise<ContextTrailItemOut[]> {
    if (contextTrailInfos.length > 32) {
      throw new InvalidRequestError("The maximum context trail length is 32");
    }
    const userId = await this.authService.readOptionalUserIdForAuthToken(
      authToken
    );
    const typedConnectingEntities = await Promise.all(
      contextTrailInfos.map(async (info) => {
        switch (info.connectingEntityType) {
          case "JUSTIFICATION": {
            const connectingEntity =
              await this.justificationsService.readJustificationForId(
                info.connectingEntityId,
                userId
              );
            return {
              connectingEntityType: info.connectingEntityType,
              connectingEntity,
              polarity: connectingEntity.polarity,
            };
          }
          case "APPEARANCE":
            return {
              connectingEntityType: info.connectingEntityType,
              connectingEntity:
                await this.appearancesService.readAppearanceForId(
                  { userId },
                  info.connectingEntityId
                ),
              polarity: "POSITIVE" as const,
            };
        }
      })
    );

    this.checkConnections(typedConnectingEntities);
    this.checkPolarities(contextTrailInfos, typedConnectingEntities);

    return typedConnectingEntities.map((info) => ({
      ...info,
      connectingEntityId: info.connectingEntity.id,
    }));
  }

  private checkConnections(typedConnectingEntities: TrailConnection[]) {
    for (let i = 1; i < typedConnectingEntities.length; i++) {
      const prev = typedConnectingEntities[i - 1];
      const curr = typedConnectingEntities[i];
      if (!areAdjacentConnectingEntities(prev, curr)) {
        const prevLogInfo = {
          type: prev.connectingEntityType,
          id: prev.connectingEntity.id,
        };
        const currLogInfo = {
          type: curr.connectingEntityType,
          id: curr.connectingEntity.id,
        };
        this.logger.error(
          `Invalid context trail. Previous ${toJson(
            prevLogInfo
          )} incompatible with current ${toJson(currLogInfo)}`
        );
        throw new ConflictError("Invalid context trail");
      }
    }
  }

  private checkPolarities(
    contextTrailInfos: ContextTrailItemInfo[],
    typedConnectingEntities: (TrailConnection & {
      polarity: RelationPolarity;
    })[]
  ) {
    let itemPolarity: RelationPolarity,
      prevItemPolarity: RelationPolarity | undefined = undefined;
    zip(contextTrailInfos, typedConnectingEntities).forEach(
      ([info, typedEntity]) => {
        if (!info || !typedEntity) {
          throw newImpossibleError(
            "typedConnectingEntities length must match contextTrailInfos"
          );
        }
        itemPolarity = prevItemPolarity
          ? contextTrailItemPolarity(typedEntity, prevItemPolarity)
          : typedEntity.polarity;
        if (info.polarity !== itemPolarity) {
          this.logger.error(
            `Context trail polarity mismatch: ${toJson(info)} vs ${toJson(
              typedEntity.connectingEntity
            )}`
          );
          throw new ConflictError(`Context trail polarity mismatch`);
        }
        prevItemPolarity = itemPolarity;
      }
    );
  }
}
