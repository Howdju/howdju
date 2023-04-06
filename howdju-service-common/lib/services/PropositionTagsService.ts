import { EntityId, Logger, requireArgs } from "howdju-common";
import { PropositionTagsDao } from "..";

export class PropositionTagsService {
  logger: Logger;
  propositionTagsDao: PropositionTagsDao;

  constructor(logger: Logger, propositionTagsDao: PropositionTagsDao) {
    requireArgs({ logger, propositionTagsDao });
    this.logger = logger;
    this.propositionTagsDao = propositionTagsDao;
  }

  async readTagsForPropositionId(propositionId: EntityId) {
    return await this.propositionTagsDao.readTagsForPropositionId(
      propositionId
    );
  }

  async readRecommendedTagsForPropositionId(propositionId: EntityId) {
    return await this.propositionTagsDao.readRecommendedTagsForPropositionId(
      propositionId
    );
  }

  async readPropositionsRecommendedForTagId(tagId: EntityId) {
    return await this.propositionTagsDao.readPropositionsRecommendedForTagId(
      tagId
    );
  }

  async readTaggedPropositionsByVotePolarityAsUser(
    userId: EntityId,
    tagId: EntityId
  ) {
    return await this.propositionTagsDao.readTaggedPropositionsByVotePolarityAsUser(
      userId,
      tagId
    );
  }
}
