import forEach from "lodash/forEach";

import {
  EntityId,
  filterDefined,
  Logger,
  PropositionTagVotePolarities,
  PropositionTagVotePolarity,
  toJson,
} from "howdju-common";

import { toTag, toProposition } from "./orm";
import { Database } from "../database";
import { map } from "lodash";
import { PropositionData, PropositionRow } from "./dataTypes";

export class PropositionTagsDao {
  logger: Logger;
  database: Database;

  constructor(logger: Logger, database: Database) {
    this.logger = logger;
    this.database = database;
  }

  async readTagsForPropositionId(propositionId: EntityId) {
    const { rows } = await this.database.query(
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
    return filterDefined(map(rows, toTag));
  }

  async readRecommendedTagsForPropositionId(propositionId: EntityId) {
    const { rows } = await this.database.query(
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
    return filterDefined(map(rows, toTag));
  }

  async readPropositionsRecommendedForTagId(tagId: EntityId) {
    const { rows } = await this.database.query(
      "readPropositionsRecommendedForTagId",
      `
        with
          proposition_scores as (
            select proposition_id, score
            from proposition_tag_scores
              where
                    tag_id = $1
                and score > 0
                and deleted is null
          )
        select s.*
        from propositions s
            join proposition_scores ss using (proposition_id)
          where s.deleted is null
        order by ss.score desc
      `,
      [tagId]
    );
    return map(rows, toProposition);
  }

  async readTaggedPropositionsByVotePolarityAsUser(
    userId: EntityId,
    tagId: EntityId
  ) {
    const { rows } = await this.database.query<
      PropositionRow & { polarity: PropositionTagVotePolarity }
    >(
      "readTaggedPropositionsByVotePolarityAsUser",
      `
        select
            s.*
          , v.polarity
        from
          proposition_tag_votes v
            join propositions s using (proposition_id)
          where
                v.user_id = $1
            and v.tag_id = $2
            and v.deleted is null
            and s.deleted is null
      `,
      [userId, tagId]
    );

    const propositionsByPolarity = {} as Record<
      PropositionTagVotePolarity,
      PropositionData[]
    >;
    forEach(rows, (row) => {
      const proposition = toProposition(row);
      if (!proposition) {
        this.logger.error(
          `readTaggedPropositionsByVotePolarityAsUser: row mapped to falsy ${toJson(
            row
          )}`
        );
        return;
      }
      let propositions = propositionsByPolarity[row.polarity];
      if (!propositions) {
        propositionsByPolarity[row.polarity] = propositions = [];
      }
      propositions.push(proposition);
    });
    return propositionsByPolarity;
  }
}
