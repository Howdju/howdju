import { map, zip } from "lodash";

import {
  AuthToken,
  TypedConnectingEntity,
  ContextTrailItemInfo,
  Logger,
  areAdjacentConnectingEntities,
  toJson,
  newImpossibleError,
  ContextTrailItem,
  RelationPolarity,
  contextTrailItemPolarity,
} from "howdju-common";

import {
  AuthService,
  ConflictError,
  InvalidRequestError,
  JustificationsService,
} from "..";

export class ContextTrailsService {
  logger: Logger;
  authService: AuthService;
  justificationsService: JustificationsService;

  constructor(
    logger: Logger,
    authService: AuthService,
    justificationsService: JustificationsService
  ) {
    this.logger = logger;
    this.authService = authService;
    this.justificationsService = justificationsService;
  }

  async readContextTrail(
    authToken: AuthToken | undefined,
    contextTrailInfos: ContextTrailItemInfo[]
  ): Promise<ContextTrailItem[]> {
    if (contextTrailInfos.length > 32) {
      throw new InvalidRequestError("The maximum context trail length is 32");
    }
    const userId = await this.authService.readOptionalUserIdForAuthToken(
      authToken
    );
    const typedConnectingEntities = await Promise.all(
      map(contextTrailInfos, async (info) => {
        switch (info.connectingEntityType) {
          case "JUSTIFICATION":
            return {
              type: info.connectingEntityType,
              entity: await this.justificationsService.readJustificationForId(
                info.connectingEntityId,
                userId
              ),
            };
        }
      })
    );

    this.checkConnections(typedConnectingEntities);
    this.checkPolarities(contextTrailInfos, typedConnectingEntities);

    return typedConnectingEntities.map(({ type, entity }) => ({
      connectingEntity: entity,
      connectingEntityId: entity.id,
      connectingEntityType: type,
      polarity: entity.polarity,
    }));
  }

  private checkConnections(typedConnectingEntities: TypedConnectingEntity[]) {
    for (let i = 1; i < typedConnectingEntities.length; i++) {
      const prev = typedConnectingEntities[i - 1];
      const curr = typedConnectingEntities[i];
      if (!areAdjacentConnectingEntities(prev, curr)) {
        const prevLogInfo = { type: prev.type, id: prev.entity.id };
        const currLogInfo = { type: curr.type, id: curr.entity.id };
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
    typedConnectingEntities: TypedConnectingEntity[]
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
        const { entity, type } = typedEntity;
        itemPolarity = prevItemPolarity
          ? contextTrailItemPolarity(type, entity, prevItemPolarity)
          : entity.polarity;
        if (info.polarity !== itemPolarity) {
          this.logger.error(
            `Context trail polarity mismatch: ${toJson(info)} vs ${toJson(
              entity
            )}`
          );
          throw new ConflictError(`Context trail polarity mismatch`);
        }
        prevItemPolarity = itemPolarity;
      }
    );
  }
}
