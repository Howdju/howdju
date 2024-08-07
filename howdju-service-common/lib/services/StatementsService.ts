import moment, { Moment } from "moment";

import {
  CreateProposition,
  CreateStatement,
  EntityId,
  newImpossibleError,
  newUnimplementedError,
  PropositionOut,
  SentenceType,
  SentenceTypes,
  StatementCreatedAs,
  StatementOut,
} from "howdju-common";

import { EntityService } from "./EntityService";
import { AuthService } from "./AuthService";
import {
  EntityNotFoundError,
  InvalidRequestError,
  PersorgsService,
  PropositionsService,
  StatementsDao,
  UsersService,
} from "..";
import { UserIdent } from "./types";
import { keyBy } from "lodash";

export class StatementsService extends EntityService<
  CreateStatement,
  StatementOut,
  never,
  never,
  "statement"
> {
  constructor(
    authService: AuthService,
    private readonly statementsDao: StatementsDao,
    private readonly persorgsService: PersorgsService,
    private readonly propositionsService: PropositionsService,
    private readonly usersService: UsersService
  ) {
    super({ createSchema: CreateStatement }, authService);
  }

  async readStatementForId(
    userIdent: UserIdent,
    statementId: EntityId
  ): Promise<StatementOut> {
    const chain = await this.statementsDao.readStatementChainForId(statementId);

    // Validate the chain
    if (!chain.length) {
      throw new EntityNotFoundError("STATEMENT", statementId);
    }
    chain.forEach(({ sentenceType }, i) => {
      if (i === 0 && sentenceType !== "PROPOSITION") {
        throw newImpossibleError(
          `Expected first sentenceType to be PROPOSITION but was ${sentenceType}`
        );
      }
      if (i > 0 && sentenceType !== "STATEMENT") {
        throw newImpossibleError(
          `Expected latter sentenceTypes to be STATEMENT but was ${sentenceType}`
        );
      }
    });

    // Read the Proposition
    const { sentenceType, sentenceId: propositionId } = chain[0];
    const proposition = await this.propositionsService.readPropositionForId(
      propositionId,
      userIdent
    );
    if (!proposition) {
      throw new EntityNotFoundError("PROPOSITION", propositionId);
    }

    // Read the Statements
    const statementIds = chain
      .slice(1)
      .map(({ sentenceId }) => sentenceId)
      .concat([chain[chain.length - 1].statementId]);
    const statements =
      await this.statementsDao.readStatementsWithoutSentencesForIds(
        statementIds
      );
    const statementsById = keyBy(statements, "id");

    // Read the related entities
    const speakerPersorgIds = statements.map(({ speaker }) => speaker.id);
    const speakerPersorgs = await this.persorgsService.readPersorgsForIds(
      speakerPersorgIds
    );
    const speakerPersorgsById = keyBy(speakerPersorgs, "id");

    const creatorUserIds = statements.map(({ creator }) => creator.id);
    const creatorUsers = await this.usersService.readUserBlurbsForIds(
      creatorUserIds
    );
    const creatorUsersById = keyBy(creatorUsers, "id");

    // Construct the StatementOut
    let prevSentenceInfo = { sentenceType, sentence: proposition } as
      | { sentenceType: "PROPOSITION"; sentence: PropositionOut }
      | { sentenceType: "STATEMENT"; sentence: StatementOut };
    for (let i = 1; i < chain.length; i++) {
      const { sentenceType, sentenceId } = chain[i];
      const statement = statementsById[sentenceId];
      const speaker = speakerPersorgsById[statement.speaker.id];
      const creator = creatorUsersById[statement.creator.id];
      prevSentenceInfo = {
        sentenceType,
        sentence: { ...statement, ...prevSentenceInfo, speaker, creator },
      };
    }
    const lastStatementId = chain[chain.length - 1].statementId;
    const lastStatement = statementsById[lastStatementId];
    const speaker = speakerPersorgsById[lastStatement.speaker.id];
    const creator = creatorUsersById[lastStatement.creator.id];
    return {
      ...lastStatement,
      ...prevSentenceInfo,
      speaker,
      creator,
    };
  }

  async doReadOrCreate(
    createStatement: CreateStatement,
    userId: EntityId,
    now: Moment
  ): Promise<{ isExtant: boolean; statement: StatementOut }> {
    // TODO(361) remove
    now = moment.isMoment(now) ? now : moment(now);

    const { createStatements, createProposition } =
      collectSentences(createStatement);
    if (!createProposition) {
      throw new InvalidRequestError(`No proposition found in statement`);
    }

    const { proposition } =
      await this.propositionsService.readOrCreatePropositionAsUser(
        createProposition,
        userId,
        now
      );

    let prevSentenceInfo = {
      sentence: proposition,
      sentenceType: "PROPOSITION",
    } as
      | { sentence: StatementOut; sentenceType: "STATEMENT" }
      | { sentence: PropositionOut; sentenceType: "PROPOSITION" };
    let isLatestStatementExtant = false;
    const rootPropositionId = proposition.id;
    for (let i = createStatements.length - 1; i >= 0; i--) {
      const currCreateStatement = createStatements[i];

      const { persorg } =
        await this.persorgsService.readOrCreateValidPersorgAsUser(
          currCreateStatement.speaker,
          userId,
          now
        );

      const equivalentStatementId =
        await this.statementsDao.readEquivalentStatementId({
          ...currCreateStatement,
          ...prevSentenceInfo,
          speaker: persorg,
        });
      if (equivalentStatementId) {
        isLatestStatementExtant = true;
        const sentence = await this.readStatementForId(
          { userId },
          equivalentStatementId
        );
        prevSentenceInfo = {
          sentence,
          sentenceType: "STATEMENT",
        };
      } else {
        const newStatement = await this.statementsDao.createStatement(
          {
            ...currCreateStatement,
            ...prevSentenceInfo,
            speaker: persorg,
          },
          rootPropositionId,
          userId,
          now
        );
        const sentence = await this.readStatementForId(
          { userId },
          newStatement.id
        );
        prevSentenceInfo = {
          sentence,
          sentenceType: "STATEMENT",
        };
        isLatestStatementExtant = false;
      }
    }
    if (prevSentenceInfo.sentenceType === "PROPOSITION") {
      throw new InvalidRequestError(`No statement found.`);
    }

    const statement = prevSentenceInfo.sentence;
    await this.updateCreatedAsForStatementsSentences(statement, proposition);

    return {
      isExtant: isLatestStatementExtant,
      statement,
    };
  }

  /** Persists and updates the inner sentences to have createdAs of the outer statement. */
  private async updateCreatedAsForStatementsSentences(
    statement: StatementOut,
    proposition: PropositionOut
  ) {
    const innerStatements = collectInnerStatements(statement);
    await Promise.all([
      this.propositionsService.updateCreatedAs(
        proposition.id,
        "STATEMENT",
        statement.id
      ),
      this.statementsDao.updateCreatedAsForStatementIds(
        innerStatements.map(({ id }) => id),
        "STATEMENT",
        statement.id
      ),
    ]);

    const createdAs: StatementCreatedAs = {
      type: "STATEMENT",
      id: statement.id,
    };
    let currSentence: StatementOut | PropositionOut | undefined =
      statement.sentence;
    while (currSentence) {
      currSentence.createdAs = createdAs;
      currSentence =
        "sentence" in currSentence ? currSentence.sentence : undefined;
    }
  }

  protected doUpdate(
    _entity: never,
    _userId: EntityId,
    _now: Moment
  ): Promise<never> {
    throw newUnimplementedError(`Updating statements is not supported`);
  }

  async readStatementsForSpeakerPersorgId(speakerPersorgId: EntityId) {
    return await this.statementsDao.readStatementsForSpeakerPersorgId(
      speakerPersorgId
    );
  }

  async readStatementsForSentenceTypeAndId(
    sentenceType: SentenceType,
    sentenceId: EntityId
  ) {
    return await this.statementsDao.readStatementsForSentenceTypeAndId(
      sentenceType,
      sentenceId
    );
  }

  async readStatementsForRootPropositionId(rootPropositionId: EntityId) {
    return await this.statementsDao.readStatementsForRootPropositionId(
      rootPropositionId
    );
  }

  async readIndirectStatementsForRootPropositionId(
    rootPropositionId: EntityId
  ) {
    return await this.statementsDao.readIndirectStatementsForRootPropositionId(
      rootPropositionId
    );
  }
}

function collectInnerStatements(statement: StatementOut) {
  const innerStatements = [];
  let currSentence: StatementOut | PropositionOut | undefined =
    statement.sentence;
  while ("sentenceType" in currSentence) {
    innerStatements.push(currSentence);
    currSentence = currSentence.sentence;
  }
  return innerStatements;
}

function collectSentences(statement: CreateStatement) {
  const createStatements = [statement];
  let createProposition: CreateProposition | undefined = undefined;
  let currStatement: CreateStatement | undefined = statement;
  while (currStatement) {
    switch (currStatement.sentenceType) {
      case SentenceTypes.STATEMENT:
        createStatements.push(currStatement.sentence);
        currStatement = currStatement.sentence;
        break;
      case SentenceTypes.PROPOSITION:
        createProposition = currStatement.sentence;
        currStatement = undefined;
        break;
    }
  }
  return {
    createStatements,
    createProposition,
  };
}
