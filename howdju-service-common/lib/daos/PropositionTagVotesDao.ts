import { EntityId, PropositionTagVotePolarity } from "howdju-common";
import { Moment } from "moment";

import { Database, PropositionTagVoteRow } from "..";
import { mapMany } from "./daosUtil";
import { toPropositionTagVote } from "./orm";

export class PropositionTagVotesDao {
  constructor(private readonly database: Database) {}

  async createPropositionTagVote(
    userId: EntityId,
    propositionId: EntityId,
    tagId: EntityId,
    polarity: PropositionTagVotePolarity,
    now: Moment
  ) {
    const {
      rows: [row],
    } = await this.database.query<PropositionTagVoteRow>(
      "createPropositionTagVote",
      `insert into proposition_tag_votes (user_id, proposition_id, tag_id, polarity, created)
      values ($1, $2, $3, $4, $5)
      returning *`,
      [userId, propositionId, tagId, polarity, now]
    );
    if (!row) {
      throw new Error(`No PropoositionTagvoteRow despite just creating it.`);
    }
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
    if (!row) {
      return undefined;
    }
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
    if (!row) {
      return undefined;
    }
    return toPropositionTagVote(row);
  }

  async readUserVotesForPropositionId(
    userId: EntityId,
    propositionId: EntityId
  ) {
    const { rows } = await this.database.query<PropositionTagVoteRow>(
      "readUserVotesForPropositionId",
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

  readVotes() {
    return this.database
      .query<PropositionTagVoteRow>(
        "readVotes",
        `select * from proposition_tag_votes where deleted is null`
      )
      .then(mapMany(toPropositionTagVote));
  }

  async deletePropositionTagVote(
    userId: EntityId,
    propositionTagVoteId: EntityId,
    now: Moment
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
