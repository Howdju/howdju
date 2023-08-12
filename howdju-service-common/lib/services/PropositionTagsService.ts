import { EntityId } from "howdju-common";
import { PropositionTagsDao } from "../daos";

export class PropositionTagsService {
  constructor(private readonly propositionTagsDao: PropositionTagsDao) {}

  readTagsForPropositionId(propositionId: EntityId) {
    return this.propositionTagsDao.readTagsForPropositionId(propositionId);
  }

  readRecommendedTagsForPropositionId(propositionId: EntityId) {
    return this.propositionTagsDao.readRecommendedTagsForPropositionId(
      propositionId
    );
  }

  readPropositionsRecommendedForTagId(tagId: EntityId) {
    return this.propositionTagsDao.readPropositionsRecommendedForTagId(tagId);
  }

  readTaggedPropositionsByVotePolarityAsUser(
    userId: EntityId,
    tagId: EntityId
  ) {
    return this.propositionTagsDao.readTaggedPropositionsByVotePolarityAsUser(
      userId,
      tagId
    );
  }
}
