import {
  AuthToken,
  EntityId,
  EntityType,
  JustificationRootTargetOut,
  JustificationRootTargetType,
} from "howdju-common";
import { AuthService } from "./AuthService";
import { JustificationsService } from "./JustificationsService";
import { PropositionsService } from "./PropositionsService";
import { StatementsService } from "./StatementsService";

import {
  JustificationRootTargetTypes,
  newExhaustedEnumError,
  EntityTypes,
} from "howdju-common";

import { EntityNotFoundError } from "../serviceErrors";
import { BasedJustificationDataOut } from "..";

const entityTypeByRootTargetType: Record<
  JustificationRootTargetType,
  EntityType
> = {
  [JustificationRootTargetTypes.PROPOSITION]: EntityTypes.PROPOSITION,
  [JustificationRootTargetTypes.STATEMENT]: EntityTypes.STATEMENT,
};

export class RootTargetJustificationsService {
  constructor(
    private readonly authService: AuthService,
    private readonly propositionsService: PropositionsService,
    private readonly statementsService: StatementsService,
    private readonly justificationsService: JustificationsService
  ) {}

  async readRootTarget(
    rootTargetType: JustificationRootTargetType,
    rootTargetId: EntityId,
    userId: EntityId | undefined
  ): Promise<JustificationRootTargetOut> {
    switch (rootTargetType) {
      case JustificationRootTargetTypes.PROPOSITION:
        return this.propositionsService.readPropositionForId(rootTargetId, {
          userId,
        });
      case JustificationRootTargetTypes.STATEMENT:
        return this.statementsService.readStatementForId(
          { userId },
          rootTargetId
        );
      default:
        throw newExhaustedEnumError(rootTargetType);
    }
  }

  async readRootTargetWithJustifications(
    rootTargetType: JustificationRootTargetType,
    rootTargetId: EntityId,
    authToken: AuthToken | undefined
  ): Promise<
    Omit<JustificationRootTargetOut, "justifications"> & {
      justifications: BasedJustificationDataOut[];
    }
  > {
    const userId = await this.authService.readOptionalUserIdForAuthToken(
      authToken
    );
    const rootTarget = await this.readRootTarget(
      rootTargetType,
      rootTargetId,
      userId
    );
    if (!rootTarget) {
      const entityType = entityTypeByRootTargetType[rootTargetType];
      throw new EntityNotFoundError(entityType, rootTargetId);
    }
    const justifications =
      await this.justificationsService.readJustificationsForRootTarget(
        rootTargetType,
        rootTargetId,
        userId
      );
    return { ...rootTarget, justifications };
  }
}
