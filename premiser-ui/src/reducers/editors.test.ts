import editors, { EditorTypes, defaultEditorState } from "./editors";
import { editors as editorActions } from "@/actions";
import {
  makeCreateCounterJustificationInput,
  JustificationRootTargetTypes,
  makeCreateJustificationInput,
} from "howdju-common";

describe("editors reducer", () => {
  describe("Counter justification editor", () => {
    test("Can begin edit", () => {
      const justification = makeCreateJustificationInput({
        rootTargetType: JustificationRootTargetTypes.PROPOSITION,
        rootTarget: {
          id: "the-root-target-id",
        },
        rootPolarity: "NEGATIVE",
      });
      const counterJustification =
        makeCreateCounterJustificationInput(justification);
      const action = editorActions.beginEdit(
        EditorTypes.COUNTER_JUSTIFICATION,
        "the-editor-id",
        counterJustification
      );

      const state = editors(undefined, action as Parameters<typeof editors>[1]);

      expect(state).toEqual({
        COUNTER_JUSTIFICATION: {
          "the-editor-id": {
            ...defaultEditorState(),
            ...{ editEntity: counterJustification },
          },
        },
      });
    });
  });
});
