const { toJustificationVote } = require("./orm");

describe("orm", () => {
  test("toJustificationVote", () => {
    const voteId = "100",
      polarity = "POSITIVE",
      justificationId = 200;
    const row = {
      justification_vote_id: voteId,
      polarity,
      justification_id: justificationId,
    };
    const expectedEntity = {
      id: voteId,
      polarity,
      justificationId,
    };
    expect(toJustificationVote(row)).toEqual(expectedEntity);
  });
});
