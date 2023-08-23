import map from "lodash/map";

import {
  brandedParse,
  CreateStatement,
  EntityId,
  Logger,
  newImpossibleError,
  PersistedEntity,
  PersorgOut,
  PropositionOut,
  SentenceType,
  SentenceTypes,
  StatementOut,
  StatementRef,
} from "howdju-common";

import { BaseDao } from "./BaseDao";
import { toStatement } from "./orm";
import { Database, PropositionsDao } from "..";
import { Moment } from "moment";
import { toIdString } from "./daosUtil";

export class StatementsDao extends BaseDao {
  constructor(
    logger: Logger,
    private readonly db: Database,
    private readonly propositionsDao: PropositionsDao
  ) {
    super(logger, db, toStatement);
  }

  async readStatementForId(statementId: EntityId) {
    const statement = await this.readStatementWithoutSentenceForId(statementId);
    if (!statement) {
      return undefined;
    }
    let sentence: typeof statement | PropositionOut = statement;
    let nextSentenceId = sentence.sentence.id as EntityId | undefined;
    while ("sentenceType" in sentence && nextSentenceId) {
      let nextSentence;
      switch (sentence.sentenceType) {
        case SentenceTypes.STATEMENT: {
          nextSentence = await this.readStatementWithoutSentenceForId(
            nextSentenceId
          );
          if (!nextSentence) {
            throw newImpossibleError(
              `No Statement found for id ${nextSentenceId} but referential integrity of the foreign keys should have ensured that one exists`
            );
          }
          nextSentenceId = nextSentence.sentence.id;
          break;
        }
        case SentenceTypes.PROPOSITION: {
          nextSentence = await this.propositionsDao.readPropositionForId(
            nextSentenceId
          );
          if (!nextSentence) {
            throw newImpossibleError(
              `No Proposition found for id ${nextSentenceId} but referential integrity of the foreign keys should have ensured that one exists`
            );
          }
          nextSentenceId = undefined;
          break;
        }
      }
      if (!nextSentence) {
        throw newImpossibleError(
          `nextSentence must have been set by our exhaustive switch cases`
        );
      }
      sentence.sentence = nextSentence;
      sentence = nextSentence;
    }

    return statement;
  }

  async readStatementChainForId(statementId: EntityId) {
    const { rows } = await this.db.query(
      "readStatementChainForId",
      `
        with recursive chain(statement_id, sentence_type, sentence_id) as (
          select
              statement_id
            , sentence_type
            , sentence_id
          from statements
          where statement_id = $1
        union all
          select
              s.statement_id
            , s.sentence_type
            , s.sentence_id
          from chain h, statements s
          where
                h.sentence_id = s.statement_id
            and h.sentence_type = 'STATEMENT'
        )
        select *
        from chain
      `,
      [statementId]
    );
    return rows
      .map(({ statement_id, sentence_type, sentence_id }) => ({
        statementId: toIdString(statement_id),
        sentenceType: sentence_type,
        sentenceId: toIdString(sentence_id),
      }))
      .reverse();
  }

  async readEquivalentStatementId(
    createStatement: CreateStatement & {
      speaker: PersorgOut;
    } & (
        | {
            sentenceType: "STATEMENT";
            sentence: StatementOut;
          }
        | {
            sentenceType: "PROPOSITION";
            sentence: PropositionOut;
          }
      )
  ) {
    const {
      rows: [row],
    } = await this.database.query(
      "readEquivalentStatementId",
      `
        select
            s.statement_id
        from statements s
          where
                s.speaker_persorg_id = $1
            and s.sentence_type = $2
            and s.sentence_id = $3
            and s.deleted is null
      `,
      [
        createStatement.speaker.id,
        createStatement.sentenceType,
        createStatement.sentence.id,
      ]
    );
    if (!row) {
      return undefined;
    }
    return toIdString(row.statement_id);
  }

  async createStatement(
    createStatement: {
      speaker: PersorgOut;
    } & (
      | {
          sentenceType: "STATEMENT";
          sentence: PersistedEntity;
        }
      | {
          sentenceType: "PROPOSITION";
          sentence: PersistedEntity;
        }
    ),
    rootPropositionId: EntityId,
    creatorUserId: EntityId,
    now: Moment
  ) {
    const {
      rows: [{ statement_id }],
    } = await this.database.query(
      "createStatement",
      `
        insert into statements
          (sentence_type, sentence_id, speaker_persorg_id, root_proposition_id, creator_user_id, created)
          values ($1, $2, $3, $4, $5, $6)
          returning statement_id
      `,
      [
        createStatement.sentenceType,
        createStatement.sentence.id,
        createStatement.speaker.id,
        rootPropositionId,
        creatorUserId,
        now,
      ]
    );
    const statement = await this.readStatementForId(toIdString(statement_id));
    if (!statement) {
      throw newImpossibleError(
        `Failed to read newly created statement having ID ${statement_id}}`
      );
    }
    return statement;
  }

  async readStatementWithoutSentenceForId(statementId: EntityId) {
    const [statement] = await this.readStatementsWithoutSentencesForIds([
      statementId,
    ]);
    return statement;
  }

  async readStatementsWithoutSentencesForIds(statementIds: EntityId[]) {
    const { rows } = await this.db.query(
      "readStatementsWithoutSentencesForIds",
      `
        select
          s.*
        from statements s
              where s.statement_id = any($1)
          and s.deleted is null
        order by array_position($1, s.statement_id)
      `,
      [statementIds]
    );
    return rows.map((row) =>
      brandedParse(StatementRef, {
        id: toIdString(row.statement_id),
        sentenceType: row.sentence_type,
        sentence: { id: toIdString(row.sentence_id) },
        speaker: { id: toIdString(row.speaker_persorg_id) },
        created: row.created,
        creator: { id: toIdString(row.creator_user_id) },
      })
    );
  }

  async readStatementsForSpeakerPersorgId(speakerPersorgId: EntityId) {
    const { rows } = await this.database.query(
      "readStatementsForSpeakerPersorgId.statementIds",
      "select * from statements s where s.speaker_persorg_id = $1 and s.deleted is null",
      [speakerPersorgId]
    );
    return await Promise.all(
      map(rows, (row) => this.readStatementForId(row.statement_id))
    );
  }

  async readStatementsForSentenceTypeAndId(
    sentenceType: SentenceType,
    sentenceId: EntityId
  ) {
    const { rows } = await this.database.query(
      "readStatementsForSentenceTypeAndId",
      "select * from statements s where s.sentence_type = $1 and s.sentence_id = $2 and s.deleted is null",
      [sentenceType, sentenceId]
    );
    return await Promise.all(
      map(rows, (row) => this.readStatementForId(row.statement_id))
    );
  }

  async readStatementsForRootPropositionId(rootPropositionId: EntityId) {
    const { rows } = await this.database.query(
      "readStatementsForRootPropositionId",
      "select * from statements s where s.root_proposition_id = $1 and s.deleted is null",
      [rootPropositionId]
    );
    return await Promise.all(
      map(rows, (row) => this.readStatementForId(row.statement_id))
    );
  }

  async readIndirectStatementsForRootPropositionId(
    rootPropositionId: EntityId
  ) {
    const { rows } = await this.database.query(
      "readIndirectStatementsForRootPropositionId",
      `select * from statements s
         where
               s.root_proposition_id = $1
           and s.sentence_type <> $2
           and s.deleted is null`,
      [rootPropositionId, SentenceTypes.PROPOSITION]
    );
    return await Promise.all(
      map(rows, (row) => this.readStatementForId(row.statement_id))
    );
  }
}
