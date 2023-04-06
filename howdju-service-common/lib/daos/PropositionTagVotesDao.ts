import { EntityId, Logger, requireArgs } from "howdju-common";

import { toPropositionTagVote } from "./orm";
import { Database } from "../database";
import { PropositionTagVoteData, PropositionTagVoteRow } from "./dataTypes";
import { map } from "lodash";

export class PropositionTagVotesDao {
  logger: Logger;
  database: Database;

  constructor(logger: Logger, database: Database) {
    requireArgs({ logger, database });
    this.logger = logger;
    this.database = database;
  }

  async createPropositionTagVote(
    userId: EntityId,
    propositionTagVote: PropositionTagVoteData,
    now: Date
  ) {
    const {
      rows: [row],
    } = await this.database.query<PropositionTagVoteRow>(
      "createPropositionTagVote",
      `insert into proposition_tag_votes (user_id, proposition_id, tag_id, polarity, created)
      values ($1, $2, $3, $4, $5)
      returning *`,
      [
        userId,
        propositionTagVote.proposition.id,
        propositionTagVote.tag.id,
        propositionTagVote.polarity,
        now,
      ]
    );
    return toPropositionTagVote(row);
  }

  async readPropositionTagVoteForId(propositionTagVoteId: EntityId) {
    const {
      rows: [row],
    } = await this.database.query<PropositionTagVoteRow>(
      "readPropositionTagVoteForId",
      `select * from proposition_tag_votes where proposition_tag_vote_id = $1 and deleted is null`,
      [propositionTagVoteId]
    );
    return toPropositionTagVote(row);
  }

  async readPropositionTagVote(
    userId: EntityId,
    propositionId: EntityId,
    tagId: EntityId
  ) {
    const {
      rows: [row],
    } = await this.database.query<PropositionTagVoteRow>(
      "readPropositionTagVote",
      `select *
        from proposition_tag_votes
          where
                user_id = $1
            and proposition_id = $2
            and tag_id = $3
            and deleted is null
      `,
      [userId, propositionId, tagId]
    );
    return toPropositionTagVote(row);
  }

  async readVotesForPropositionIdAsUser(
    userId: EntityId,
    propositionId: EntityId
  ) {
    const { rows } = await this.database.query(
      "readVotesForPropositionIdAsUser",
      `select *
      from proposition_tag_votes
        where
              user_id = $1
          and proposition_id = $2
          and deleted is null
      `,
      [userId, propositionId]
    );
    return rows.map(toPropositionTagVote);
  }

  async readVotes() {
    const { rows } = await this.database.query(
      "readVotes",
      `select * from proposition_tag_votes where deleted is null`
    );
    return map(rows, toPropositionTagVote);
  }

  async deletePropositionTagVote(
    userId: EntityId,
    propositionTagVoteId: EntityId,
    now: Date
  ) {
    const {
      rows: [{ proposition_tag_vote_id }],
    } = await this.database.query(
      "deletePropositionTagVote",
      `update proposition_tag_votes
      set deleted = $1
      where
            user_id = $2
        and proposition_tag_vote_id = $3
      returning proposition_tag_vote_id
      `,
      [now, userId, propositionTagVoteId]
    );
    return proposition_tag_vote_id;
  }
}
