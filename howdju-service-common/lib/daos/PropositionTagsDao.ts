import { reduce, uniq } from "lodash";

import {
  EntityId,
  PropositionOut,
  PropositionTagVotePolarities,
  PropositionTagVotePolarity,
  TagOut,
} from "howdju-common";

import { Database } from "../database";
import { toIdString } from "./daosUtil";
import { PropositionData } from "./dataTypes";
import { PropositionsDao } from "./PropositionsDao";

export class PropositionTagsDao {
  constructor(
    private readonly database: Database,
    private readonly propositionsDao: PropositionsDao
  ) {}

  async readTagsForPropositionIds(propositionIds: EntityId[]) {
    const { rows } = await this.database.query(
      "readTagsForPropositionIds",
      `
        select
            v.proposition_id
          , t.tag_id
          , t.name
        from
          tags t
            join proposition_tag_votes v using (tag_id)
          where
                v.proposition_id = any ($1)
            and v.polarity = $2
            and v.deleted is null
            and t.deleted is null
        group by 1, 2, 3
      `,
      [propositionIds, PropositionTagVotePolarities.POSITIVE]
    );
    return reduce(
      rows,
      (acc, { proposition_id, tag_id, name }) => {
        const propositionId = toIdString(proposition_id);
        if (!(propositionId in acc)) {
          acc[propositionId] = [];
        }
        acc[propositionId].push({
          id: toIdString(tag_id),
          name,
        });
        return acc;
      },
      {} as Record<EntityId, TagOut[]>
    );
  }

  async readRecommendedTagsForPropositionIds(propositionIds: EntityId[]) {
    const { rows } = await this.database.query(
      "readRecommendedTagsForPropositionIds",
      `
        select
            s.proposition_id
          , t.tag_id
          , t.name
          , s.score
        from
          tags t
            join proposition_tag_scores s using (tag_id)
          where
                s.proposition_id = any ($1)
            and s.score > 0
            and s.deleted is null
            and t.deleted is null
        order by proposition_id, score desc
      `,
      [propositionIds]
    );
    return reduce(
      rows,
      (acc, { proposition_id, tag_id, name }) => {
        const propositionId = toIdString(proposition_id);
        if (!(propositionId in acc)) {
          acc[propositionId] = [];
        }
        acc[propositionId].push({
          id: toIdString(tag_id),
          name,
        });
        return acc;
      },
      {} as Record<EntityId, TagOut[]>
    );
  }

  async readPropositionsRecommendedForTagId(tagId: EntityId) {
    const { rows } = await this.database.query(
      "readPropositionsRecommendedForTagId",
      `
        with
          proposition_scores as (
            select
                proposition_id
              , score
            from proposition_tag_scores
              where
                    tag_id = $1
                and score > 0
                and deleted is null
          )
        select p.proposition_id
        from propositions p
            join proposition_scores ps using (proposition_id)
          where p.deleted is null
        order by ps.score desc
      `,
      [tagId]
    );
    const propositions = await this.propositionsDao.readPropositionsForIds(
      rows.map((row) => row.proposition_id)
    );
    return propositions.map((p) => {
      if (!p) {
        throw new Error(
          `Failed to read a proposition by ID that we just queried.`
        );
      }
      return p;
    });
  }

  async readTaggedPropositionsByVotePolarityAsUser(
    userId: EntityId,
    tagId: EntityId
  ) {
    const { rows } = await this.database.query(
      "readTaggedPropositionsByVotePolarityAsUser",
      `
        select
            p.proposition_id
          , v.polarity
          , v.proposition_tag_vote_id
        from
               proposition_tag_votes v
          join propositions p using (proposition_id)
          where
                v.user_id = $1
            and v.tag_id = $2
            and v.deleted is null
            and p.deleted is null
      `,
      [userId, tagId]
    );
    const propositionIds = uniq(rows.map((r) => r.proposition_id));
    const propositions = await this.propositionsDao.readPropositionsForIds(
      propositionIds
    );
    const propositionById = propositions.reduce((acc, p, index) => {
      if (!p)
        throw new Error(
          `Proposition ${propositionIds[index]} was missing despite having a vote.`
        );
      acc[p.id] = p;
      return acc;
    }, {} as Record<EntityId, PropositionOut>);

    const propositionsByPolarity = rows.reduce((acc, r) => {
      const proposition = propositionById[r.proposition_id];
      if (!proposition)
        throw new Error(
          `Proposition ${r.proposition_id} was missing despite having a proposition tag vote ${r.proposition_tag_vote_id}.`
        );
      const propositions = acc[r.polarity];
      if (!propositions) {
        acc[r.polarity] = [proposition];
      } else {
        propositions.push(proposition);
      }
      return acc;
    }, {} as Record<PropositionTagVotePolarity, PropositionData>);
    return propositionsByPolarity;
  }
}
