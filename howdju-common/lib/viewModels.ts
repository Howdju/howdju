import { JustificationOut, PropositionOut, StatementOut } from "./apiModels";

/** A JustificationOut that has been joined with its root target in the client */
export type JustificationView = Omit<
  JustificationOut,
  "rootTarget" | "rootTargetType" | "target"
> &
  (
    | {
        rootTargetType: "PROPOSITION";
        rootTarget: PropositionOut;
      }
    | {
        rootTargetType: "STATEMENT";
        rootTarget: StatementOut;
      }
  ) & {
    target:
      | {
          type: "PROPOSITION";
          entity: PropositionOut;
        }
      | {
          type: "STATEMENT";
          entity: StatementOut;
        }
      | {
          type: "JUSTIFICATION";
          entity: JustificationView;
        };
  };
