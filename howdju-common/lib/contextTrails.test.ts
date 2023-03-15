import {
  ContextTrailItemInfo,
  parseContextTrail,
  serializeContextTrail,
} from "./contextTrails";

describe("serializeContextTrail", () => {
  test("Correctly serializes a context trail", () => {
    const contextTrail: ContextTrailItemInfo[] = [
      {
        connectingEntityId: "1",
        connectingEntityType: "JUSTIFICATION",
        polarity: "POSITIVE",
      },
    ];
    expect(serializeContextTrail(contextTrail)).toBe("j,1,p");
  });
});

describe("parseContextTrail", () => {
  test("Correctly parses a serialized context trail", () => {
    expect(parseContextTrail("j,1,p")).toEqual({
      infos: [
        {
          connectingEntityId: "1",
          connectingEntityType: "JUSTIFICATION",
          polarity: "POSITIVE",
        },
      ],
      invalidInfos: [],
      hasInvalidInfos: false,
    });
  });
  test("Identifies invalid context trail infos", () => {
    expect(parseContextTrail("j,1,p;x,2,p;j,3,y;j,4,n")).toEqual({
      infos: [
        {
          connectingEntityId: "1",
          connectingEntityType: "JUSTIFICATION",
          polarity: "POSITIVE",
        },
        {
          connectingEntityId: "4",
          connectingEntityType: "JUSTIFICATION",
          polarity: "NEGATIVE",
        },
      ],
      invalidInfos: ["x,2,p", "j,3,y"],
      hasInvalidInfos: true,
    });
  });
});
