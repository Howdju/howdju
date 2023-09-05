import { EntityId } from "howdju-common";
import { PropositionTagsDao } from "../daos";

export class PropositionTagsService {
  constructor(private readonly propositionTagsDao: PropositionTagsDao) {}

  readTagsForPropositionIds(propositionIds: EntityId[]) {
    return this.propositionTagsDao.readTagsForPropositionIds(propositionIds);
  }

  readRecommendedTagsForPropositionIds(propositionIds: EntityId[]) {
    return this.propositionTagsDao.readRecommendedTagsForPropositionIds(
      propositionIds
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
