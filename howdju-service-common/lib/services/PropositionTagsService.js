const { requireArgs } = require("howdju-common");

exports.PropositionTagsService = class PropositionTagsService {
  constructor(logger, propositionTagsDao) {
    requireArgs({ logger, propositionTagsDao });
    this.logger = logger;
    this.propositionTagsDao = propositionTagsDao;
  }

  readTagsForPropositionId(propositionId) {
    return this.propositionTagsDao.readTagsForPropositionId(propositionId);
  }

  readRecommendedTagsForPropositionId(propositionId) {
    return this.propositionTagsDao.readRecommendedTagsForPropositionId(
      propositionId
    );
  }

  readPropositionsRecommendedForTagId(tagId) {
    return this.propositionTagsDao.readPropositionsRecommendedForTagId(tagId);
  }

  readTaggedPropositionsByVotePolarityAsUser(userId, tagId) {
    return this.propositionTagsDao.readTaggedPropositionsByVotePolarityAsUser(
      userId,
      tagId
    );
  }
};
