import { Moment } from "moment";

import {
  EntityId,
  AuthToken,
  utcNow,
  CreateTag,
  PropositionTagVotePolarity,
} from "howdju-common";

import {
  AuthService,
  EntityNotFoundError,
  PropositionTagVotesDao,
  TagsService,
} from "..";

export class PropositionTagVotesService {
  constructor(
    private readonly authService: AuthService,
    private readonly tagsService: TagsService,
    private readonly propositionTagVotesDao: PropositionTagVotesDao
  ) {}

  readUserVotesForPropositionIds(userId: EntityId, propositionIds: EntityId[]) {
    return this.propositionTagVotesDao.readUserVotesForPropositionIds(
      userId,
      propositionIds
    );
  }

  async readOrCreatePropositionTagVoteAsUser(
    userId: EntityId,
    propositionId: EntityId,
    createTag: CreateTag,
    polarity: PropositionTagVotePolarity,
    now: Moment
  ) {
    const tag = await this.tagsService.readOrCreateValidTagAsUser(
      userId,
      createTag,
      now
    );
    const overlappingVote =
      await this.propositionTagVotesDao.readPropositionTagVote(
        userId,
        propositionId,
        tag.id
      );
    if (overlappingVote) {
      if (overlappingVote.polarity === polarity) {
        return { ...overlappingVote, tag };
      } else {
        await this.propositionTagVotesDao.deletePropositionTagVote(
          userId,
          overlappingVote.id,
          now
        );
      }
    }
    const propostionTagVote =
      await this.propositionTagVotesDao.createPropositionTagVote(
        userId,
        propositionId,
        tag.id,
        polarity,
        now
      );
    return { ...propostionTagVote, tag };
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
        utcNow()
      );
    if (!deletedPropositionTagVoteId) {
      throw new EntityNotFoundError("PROPOSITION_TAG_VOTE", {
        userId,
        propositionTagVoteId,
      });
    }
    return deletedPropositionTagVoteId;
  }
}
