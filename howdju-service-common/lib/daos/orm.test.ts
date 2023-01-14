import { toIdString } from "./daosUtil";
import { toJustificationVote } from "./orm";
import { JustificationVoteRow } from "./dataTypes";

describe("orm", () => {
  test("toJustificationVote", () => {
    const voteId = 100;
    const polarity = "POSITIVE";
    const justificationId = 200;
    const row: JustificationVoteRow = {
      justification_vote_id: voteId,
      polarity,
      justification_id: justificationId,
    };
    const expectedEntity = {
      id: toIdString(voteId),
      polarity,
      justification: {
        id: toIdString(justificationId),
      },
      justificationId: toIdString(justificationId),
    };
    expect(toJustificationVote(row)).toEqual(expectedEntity);
  });
});
