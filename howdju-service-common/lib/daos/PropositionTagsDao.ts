import { uniq } from "lodash";

import {
  EntityId,
  PropositionOut,
  PropositionTagVotePolarities,
  PropositionTagVotePolarity,
} from "howdju-common";

import { Database } from "../database";
import { PropositionsDao } from "./PropositionsDao";
import { PropositionData } from "./dataTypes";

interface TagRow {
  tag_id: EntityId;
  name: string;
}

export class PropositionTagsDao {
  constructor(
    private readonly database: Database,
    private readonly propositionsDao: PropositionsDao
  ) {}

  async readTagsForPropositionId(propositionId: EntityId) {
    const { rows } = await this.database.query<TagRow>(
      "readTagsForPropositionId",
      `
        with
          proposition_tag_ids as (
            select distinct tag_id
            from proposition_tag_votes
              where
                    proposition_id = $1
                and polarity = $2
                and deleted is null
          )
        select * from tags where tag_id in (select * from proposition_tag_ids) and deleted is null
      `,
      [propositionId, PropositionTagVotePolarities.POSITIVE]
    );
    return rows.map((row) => ({
      id: row.tag_id,
      name: row.name,
    }));
  }

  async readRecommendedTagsForPropositionId(propositionId: EntityId) {
    const { rows } = await this.database.query<TagRow>(
      "readRecommendedTagsForPropositionId",
      `
        with
          tag_scores as (
            select tag_id, score
            from proposition_tag_scores
              where
                    proposition_id = $1
                and score > 0
                and deleted is null
          )
        select t.*
        from tags t
            join tag_scores s using (tag_id)
          where t.deleted is null
        order by s.score desc
      `,
      [propositionId]
    );

    return rows.map((row) => ({
      id: row.tag_id,
      name: row.name,
    }));
  }

  async readPropositionsRecommendedForTagId(tagId: EntityId) {
    const { rows } = await this.database.query(
      "readPropositionsRecommendedForTagId",
      `
        with
          proposition_scores as (
            select
              proposition_id, score
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
            p.proposition_id,
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
