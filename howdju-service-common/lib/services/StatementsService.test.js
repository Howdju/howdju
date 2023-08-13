const sinon = require("sinon");
const { clone, merge } = require("lodash");

const { mockLogger } = require("howdju-test-common");
const { SentenceTypes } = require("howdju-common");

const { StatementsService } = require("./StatementsService");

describe("StatementsService", () => {
  describe("doReadOrCreate", () => {
    test("creates a statement", async () => {
      const now = new Date();
      const userId = 1;
      const propositionId = 10;
      const statementId = 20;
      const innerStatementId = 21;
      const speaker1Id = 30;
      const speaker2Id = 31;
      const speaker1 = {
        isOrganization: false,
        name: "Roger Rabbit",
        knownFor: "animated acting",
        websiteUrl: "http://toontown.com/roger",
      };
      const speaker2 = {
        isOrganization: true,
        name: "Doom Corp.",
      };
      const proposition = {
        text: "What if a much of a which of a wind",
      };
      const innerStatement = {
        speaker: speaker1,
        sentenceType: SentenceTypes.PROPOSITION,
        sentence: proposition,
      };
      const statement = {
        speaker: speaker2,
        sentenceType: SentenceTypes.STATEMENT,
        sentence: innerStatement,
      };
      const statementsDao = {
        createStatement: sinon.fake((statement) => {
          const copy = clone(statement);
          if (copy.speaker.name === "Roger Rabbit") {
            copy.id = innerStatementId;
          } else {
            copy.id = statementId;
          }
          return copy;
        }),
        readEquivalentStatement: sinon.fake.returns(null),
      };
      const persorgsService = {
        readOrCreateValidPersorgAsUser: sinon.fake((persorg) => {
          const copy = clone(persorg);
          if (copy.name === "Roger Rabbit") {
            copy.id = speaker1Id;
          } else {
            copy.id = speaker2Id;
          }
          return { persorg: copy };
        }),
      };
      const propositionsService = {
        readOrCreatePropositionAsUser: sinon.fake((proposition) => {
          const copy = clone(proposition);
          copy.id = propositionId;
          return { proposition: copy };
        }),
      };
      const statementsService = new StatementsService(
        mockLogger,
        {},
        statementsDao,
        persorgsService,
        propositionsService
      );
      const expected = merge(
        {
          id: statementId,
          rootPropositionId: propositionId,
          speaker: {
            id: speaker2Id,
          },
          sentence: {
            id: innerStatementId,
            rootPropositionId: propositionId,
            speaker: {
              id: speaker1Id,
            },
            sentence: {
              id: propositionId,
            },
          },
        },
        statement
      );

      const { statement: actual } = await statementsService.doReadOrCreate(
        statement,
        userId,
        now
      );

      expect(actual).toEqual(expected);
      sinon.assert.callCount(
        propositionsService.readOrCreatePropositionAsUser,
        1
      );
      sinon.assert.calledWith(
        propositionsService.readOrCreatePropositionAsUser,
        proposition,
        userId,
        now
      );
      sinon.assert.callCount(persorgsService.readOrCreateValidPersorgAsUser, 2);
      sinon.assert.calledWith(
        persorgsService.readOrCreateValidPersorgAsUser.getCall(0),
        speaker1,
        userId,
        now
      );
      sinon.assert.calledWith(
        persorgsService.readOrCreateValidPersorgAsUser.getCall(1),
        speaker2,
        userId,
        now
      );
      sinon.assert.callCount(statementsDao.createStatement, 2);
      sinon.assert.calledWith(
        statementsDao.createStatement.getCall(0),
        innerStatement,
        userId,
        now
      );
      sinon.assert.calledWith(
        statementsDao.createStatement.getCall(1),
        statement,
        userId,
        now
      );
    });
  });
});
