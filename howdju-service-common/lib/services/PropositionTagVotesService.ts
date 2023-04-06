import {
  requireArgs,
  EntityTypes,
  Logger,
  EntityId,
  AuthToken,
  CreatePropositionTagVote,
} from "howdju-common";

import { PropositionTagVoteValidator } from "../validators";
import { PropositionTagVotesDao } from "../daos";
import { AuthService } from "./AuthService";
import { TagsService } from "./TagsService";
import { EntityValidationError } from "..";

export class PropositionTagVotesService {
  logger: Logger;
  propositionTagVoteValidator: PropositionTagVoteValidator;
  authService: AuthService;
  tagsService: TagsService;
  propositionTagVotesDao: PropositionTagVotesDao;

  constructor(
    logger: Logger,
    propositionTagVoteValidator: PropositionTagVoteValidator,
    authService: AuthService,
    tagsService: TagsService,
    propositionTagVotesDao: PropositionTagVotesDao
  ) {
    requireArgs({
      logger,
      propositionTagVoteValidator,
      authService,
      tagsService,
      propositionTagVotesDao,
    });

    this.logger = logger;
    this.propositionTagVoteValidator = propositionTagVoteValidator;
    this.authService = authService;
    this.tagsService = tagsService;
    this.propositionTagVotesDao = propositionTagVotesDao;
  }

  async readVotesForPropositionIdAsUser(
    userId: EntityId,
    propositionId: EntityId
  ) {
    return await this.propositionTagVotesDao.readVotesForPropositionIdAsUser(
      userId,
      propositionId
    );
  }

  async readOrCreatePropositionTagVote(
    authToken: AuthToken,
    propositionTagVote: CreatePropositionTagVote
  ) {
    const userId = await this.authService.readUserIdForAuthToken(authToken);
    return await this.readOrCreatePropositionTagVoteAsUser(
      userId,
      propositionTagVote,
      new Date()
    );
  }

  async readOrCreatePropositionTagVoteAsUser(
    userId: EntityId,
    propositionTagVote: CreatePropositionTagVote,
    now: Date
  ) {
    const validationErrors =
      this.propositionTagVoteValidator.validate(propositionTagVote);
    if (validationErrors.hasErrors) {
      throw new EntityValidationError(validationErrors);
    }
    return await this.readOrCreateValidPropositionTagVoteAsUser(
      userId,
      propositionTagVote,
      now
    );
  }

  async readOrCreateValidPropositionTagVoteAsUser(
    userId: EntityId,
    createPropositionTagVote: CreatePropositionTagVote,
    now: Date
  ) {
    const tag = createPropositionTagVote.tag.id
      ? await this.tagsService.readTagForId(createPropositionTagVote.tag.id)
      : await this.tagsService.readOrCreateValidTagAsUser(
          userId,
          createPropositionTagVote.tag,
          now
        );
    const overlappingVote =
      await this.propositionTagVotesDao.readPropositionTagVote(
        userId,
        createPropositionTagVote.proposition.id,
        tag.id
      );
    if (overlappingVote) {
      if (overlappingVote.polarity === createPropositionTagVote.polarity) {
        return overlappingVote;
      }
      // overlapping vote contradicts new vote, so delete it
      await this.propositionTagVotesDao.deletePropositionTagVote(
        userId,
        overlappingVote.id,
        now
      );
    }
    const propositionTagVote =
      await this.propositionTagVotesDao.createPropositionTagVote(
        userId,
        createPropositionTagVote,
        now
      );
    propositionTagVote.tag = tag;
    return propositionTagVote;
  }

  async deletePropositionTagVoteForId(
    authToken: AuthToken,
    propositionTagVoteId: EntityId
  ) {
    const userId = await this.authService.readUserIdForAuthToken(authToken);
    const deletedPropositionTagVoteId =
      await this.propositionTagVotesDao.deletePropositionTagVote(
        userId,
        propositionTagVoteId,
        new Date()
      );
    if (!deletedPropositionTagVoteId) {
      throw new EntityNotFoundError(EntityTypes.PROPOSITION_TAG_VOTE, {
        userId,
        propositionTagVoteId,
      });
    }
    return deletedPropositionTagVoteId;
  }
}
