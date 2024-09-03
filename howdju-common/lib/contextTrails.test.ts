import {
  ContextTrailItemInfo,
  nextContextTrailItem,
  parseContextTrail,
  serializeContextTrail,
} from "./contextTrails";
import { utcNow } from "./general";
import { JustificationView } from "./viewModels";

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

describe("nextContextTrailItem", () => {
  test("negates the polarity of a justification countering a positive-leaning justification", () => {
    const proposition = {
      id: "1",
      text: "the-proposition-text",
      created: utcNow(),
    };
    const basis = {
      type: "PROPOSITION_COMPOUND" as const,
      entity: {
        id: "1",
        created: utcNow(),
        atoms: [
          {
            propositionCompoundId: "1",
            entity: proposition,
          },
        ],
      },
    };
    const justification = {
      id: "1",
      polarity: "POSITIVE" as const,
      created: utcNow(),
      rootPolarity: "POSITIVE" as const,
      rootTargetType: "PROPOSITION" as const,
      target: { type: "PROPOSITION" as const, entity: proposition },
      basis,
      rootTarget: proposition,
    };
    const connectingEntityType = "JUSTIFICATION";
    const connectingEntity = {
      id: "2",
      target: {
        type: "JUSTIFICATION" as const,
        entity: justification,
      },
      basis,
      created: utcNow(),
      polarity: "NEGATIVE" as const,
      rootPolarity: "NEGATIVE" as const,
      rootTargetType: "PROPOSITION" as const,
      rootTarget: proposition,
    } as JustificationView;

    expect(
      nextContextTrailItem(
        { connectingEntityType, connectingEntity },
        "POSITIVE"
      )
    ).toEqual({
      connectingEntityType: "JUSTIFICATION",
      connectingEntity,
      connectingEntityId: connectingEntity.id,
      polarity: "NEGATIVE",
    });
  });
  test("negates the polarity of a justification countering a negative-leaning justification", () => {
    const proposition = {
      id: "1",
      text: "the-proposition-text",
      created: utcNow(),
    };
    const basis = {
      type: "PROPOSITION_COMPOUND" as const,
      entity: {
        id: "1",
        created: utcNow(),
        atoms: [
          {
            propositionCompoundId: "1",
            entity: proposition,
          },
        ],
      },
    };
    const justification = {
      id: "1",
      polarity: "NEGATIVE" as const,
      created: utcNow(),
      rootPolarity: "NEGATIVE" as const,
      rootTargetType: "PROPOSITION" as const,
      target: { type: "PROPOSITION" as const, entity: proposition },
      basis,
      rootTarget: proposition,
    };
    const connectingEntityType = "JUSTIFICATION";
    const connectingEntity = {
      id: "2",
      target: {
        type: "JUSTIFICATION" as const,
        entity: justification,
      },
      basis,
      created: utcNow(),
      polarity: "NEGATIVE" as const,
      rootPolarity: "NEGATIVE" as const,
      rootTargetType: "PROPOSITION" as const,
      rootTarget: proposition,
    } as JustificationView;

    expect(
      nextContextTrailItem(
        { connectingEntityType, connectingEntity },
        "NEGATIVE"
      )
    ).toEqual({
      connectingEntityType: "JUSTIFICATION",
      connectingEntity,
      connectingEntityId: connectingEntity.id,
      polarity: "POSITIVE",
    });
  });
});
