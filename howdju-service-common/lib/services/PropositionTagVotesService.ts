import { Moment } from "moment";

import {
  EntityId,
  AuthToken,
  utcNow,
  CreateTag,
  PropositionTagVotePolarity,
  Logger,
  PropositionTagVoteOut,
} from "howdju-common";

import {
  AuthService,
  EntityNotFoundError,
  PropositionTagVotesDao,
  TagsService,
} from "..";

export class PropositionTagVotesService {
  constructor(
    private readonly logger: Logger,
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
  ): Promise<PropositionTagVoteOut> {
    const tag = await this.tagsService.readOrCreateValidTagAsUser(
      userId,
      createTag,
      now
    );
    const overlappingVotes =
      await this.propositionTagVotesDao.readPropositionTagVotes(
        userId,
        propositionId,
        tag.id
      );
    const redundantVotes: PropositionTagVoteOut[] = [];
    const inconsistentVotes: PropositionTagVoteOut[] = [];
    for (const overlappingVote of overlappingVotes) {
      if (overlappingVote.polarity === polarity) {
        redundantVotes.push(overlappingVote);
      } else {
        inconsistentVotes.push(overlappingVote);
      }
    }
    if (inconsistentVotes.length) {
      await Promise.all(
        inconsistentVotes.map((vote) =>
          this.propositionTagVotesDao.deletePropositionTagVote(
            userId,
            vote.id,
            now
          )
        )
      );
    }
    if (redundantVotes.length) {
      const [redundantVote, ...extraRedundantVotes] = redundantVotes;
      if (extraRedundantVotes.length) {
        this.logger.error(
          `More than one redundant vote for proposition ${propositionId} and tag ${tag.id}`
        );
      }
      await Promise.all(
        extraRedundantVotes.map((vote) =>
          this.propositionTagVotesDao.deletePropositionTagVote(
            userId,
            vote.id,
            now
          )
        )
      );
      return { ...redundantVote, tag };
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
