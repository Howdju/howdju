import { map } from "lodash";

import {
  AuthToken,
  ConnectingEntity,
  ContextTrailItem,
  ContextTrailItemInfo,
  Entity,
  EntityId,
  FocusEntityType,
  Logger,
} from "howdju-common";

import {
  AuthService,
  ConflictError,
  InvalidRequestError,
  JustificationsService,
  PropositionsService,
  StatementsService,
} from "..";

export class ContextTrailsService {
  logger: Logger;
  authService: AuthService;
  justificationsService: JustificationsService;
  propositionsService: PropositionsService;
  statementsService: StatementsService;

  constructor(
    logger: Logger,
    authService: AuthService,
    justificationsService: JustificationsService,
    propositionsService: PropositionsService,
    statementsService: StatementsService
  ) {
    this.logger = logger;
    this.authService = authService;
    this.justificationsService = justificationsService;
    this.propositionsService = propositionsService;
    this.statementsService = statementsService;
  }

  async readContextTrail(
    authToken: AuthToken | undefined,
    contextTrailInfos: ContextTrailItemInfo[],
    focusEntityType: FocusEntityType,
    focusEntityid: EntityId
  ): Promise<ContextTrailItem[]> {
    if (contextTrailInfos.length > 32) {
      throw new InvalidRequestError("The maximum context trail length is 32");
    }
    const userId = await this.authService.readUserIdForAuthToken(authToken);
    const connectingEntityAndInfos = await Promise.all(
      map(contextTrailInfos, async (info) => {
        switch (info.connectingEntityType) {
          case "JUSTIFICATION":
            return {
              info,
              entity: await this.justificationsService.readJustificationForId(
                info.connectingEntityId,
                userId
              ),
            };
        }
      })
    );
    const focusEntity = await this.readFocusEntity(
      focusEntityType,
      focusEntityid
    );

    this.checkConnections(
      connectingEntityAndInfos,
      focusEntityType,
      focusEntity
    );

    return connectingEntityAndInfos.map(({ info, entity }) => ({
      connectingEntity: entity,
      connectingEntityId: entity.id,
      connectingEntityType: info.connectingEntityType,
      polarity: entity.polarity,
    }));
  }

  private async readFocusEntity(
    focusEntityType: FocusEntityType,
    focusEntityid: EntityId
  ) {
    switch (focusEntityType) {
      case "PROPOSITION":
        return await this.propositionsService.readPropositionForId(
          focusEntityid
        );
      case "STATEMENT":
        return await this.statementsService.readStatementForId(focusEntityid);
    }
  }

  private checkConnections(
    connectingEntityAndInfos: ConnectingEntityAndInfo[],
    focusEntityType: FocusEntityType,
    focusEntity: Entity
  ) {
    for (let i = 1; i < connectingEntityAndInfos.length; i++) {
      const prev = connectingEntityAndInfos[i - 1];
      const curr = connectingEntityAndInfos[i];
      const prevSourceId = getConnectingEntitySourceId(prev);
      const currTargetId = getConnectingEntityTargetId(curr);
      if (prevSourceId !== currTargetId) {
        const prevType = prev.info.connectingEntityType;
        const currType = curr.info.connectingEntityType;
        this.logger.error(
          `Invalid context trail. Previous ${prevType}'s source id (${prevSourceId}) is not equal to current ${currType}'s target ID ${currTargetId}.`
        );
        throw new ConflictError("Invalid context trail");
      }
    }

    const last = connectingEntityAndInfos[connectingEntityAndInfos.length - 1];
    const lastSourceId = getConnectingEntitySourceId(last);
    if (lastSourceId !== focusEntity.id) {
      const lastType = last.info.connectingEntityType;
      this.logger.error(
        `Invalid context trail. Last ${lastType}'s source id (${lastSourceId}) is not equal to focus ${focusEntityType}'s ID ${focusEntity.id}.`
      );
      throw new ConflictError("Invalid context trail");
    }
  }
}

type ConnectingEntityAndInfo = {
  info: ContextTrailItemInfo;
  entity: ConnectingEntity;
};

function getConnectingEntitySourceId(
  connectingEntityAndInfo: ConnectingEntityAndInfo
) {
  switch (connectingEntityAndInfo.info.connectingEntityType) {
    case "JUSTIFICATION":
      return connectingEntityAndInfo.entity.basis.entity.id;
  }
}

function getConnectingEntityTargetId(
  connectingEntityAndInfo: ConnectingEntityAndInfo
) {
  switch (connectingEntityAndInfo.info.connectingEntityType) {
    case "JUSTIFICATION":
      return connectingEntityAndInfo.entity.target.entity.id;
  }
}
