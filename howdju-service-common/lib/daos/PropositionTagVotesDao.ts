import {
  brandedParse,
  EntityId,
  PropositionRef,
  PropositionTagVoteOut,
  PropositionTagVotePolarity,
  PropositionTagVoteRef,
  TagRef,
} from "howdju-common";
import { reduce } from "lodash";
import { Moment } from "moment";

import { Database, PropositionTagVoteRow } from "..";
import { mapMany, toIdString } from "./daosUtil";
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

  async readUserVotesForPropositionIds(
    userId: EntityId,
    propositionIds: EntityId[]
  ) {
    const { rows } = await this.database.query<PropositionTagVoteRow>(
      "readUserVotesForPropositionIds",
      `select
            *
      from proposition_tag_votes
        where
              user_id = $1
          and proposition_id = any ($2)
          and deleted is null
      `,
      [userId, propositionIds]
    );

    return reduce(
      rows,
      (acc, row) => {
        const propositionId = toIdString(row.proposition_id);
        if (!(propositionId in acc)) {
          acc[propositionId] = [];
        }
        const vote = brandedParse(PropositionTagVoteRef, {
          id: toIdString(row.proposition_tag_vote_id),
          polarity: row.polarity,
          proposition: brandedParse(PropositionRef, {
            id: propositionId,
          }),
          tag: brandedParse(TagRef, {
            id: toIdString(row.tag_id),
            name: row.tag_name,
          }),
        });
        acc[propositionId].push(vote);
        return acc;
      },
      {} as Record<EntityId, PropositionTagVoteOut[]>
    );
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
