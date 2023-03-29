import { brandedParse, JustificationRef } from "howdju-common";

import { nextContextTrailItem } from "./viewModels";

describe("nextContextTrailItem", () => {
  test("negates the polarity of a justification countering a positive-leaning justification", () => {
    const justification = brandedParse(JustificationRef, {
      id: "1",
      polarity: "POSITIVE",
    });
    const connectingEntityType = "JUSTIFICATION";
    const connectingEntity = brandedParse(JustificationRef, {
      id: "2",
      target: {
        type: "JUSTIFICATION",
        entity: justification,
      },
    });

    expect(
      nextContextTrailItem(connectingEntityType, connectingEntity, "POSITIVE")
    ).toEqual({
      connectingEntityType: "JUSTIFICATION",
      connectingEntity,
      connectingEntityId: connectingEntity.id,
      polarity: "NEGATIVE",
    });
  });
  test("negates the polarity of a justification countering a negative-leaning justification", () => {
    const justification = brandedParse(JustificationRef, {
      id: "1",
      polarity: "NEGATIVE",
    });
    const connectingEntityType = "JUSTIFICATION";
    const connectingEntity = brandedParse(JustificationRef, {
      id: "2",
      target: {
        type: "JUSTIFICATION",
        entity: justification,
      },
    });

    expect(
      nextContextTrailItem(connectingEntityType, connectingEntity, "NEGATIVE")
    ).toEqual({
      connectingEntityType: "JUSTIFICATION",
      connectingEntity,
      connectingEntityId: connectingEntity.id,
      polarity: "POSITIVE",
    });
  });
});
