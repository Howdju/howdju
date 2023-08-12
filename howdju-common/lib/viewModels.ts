import {
  AppearanceOut,
  JustificationOut,
  MediaExcerptOut,
  PropositionCompoundOut,
  PropositionOut,
  StatementOut,
  UrlLocatorOut,
  WritQuoteOut,
} from "./apiModels";

/** A JustificationOut that has been joined with its root target in the client */
export type JustificationView = Omit<
  JustificationOut,
  "rootTarget" | "rootTargetType" | "target" | "basis"
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
  } & {
    basis:
      | {
          type: "PROPOSITION_COMPOUND";
          entity: PropositionCompoundOut;
        }
      | {
          type: "MEDIA_EXCERPT";
          entity: MediaExcerptView;
        }
      | {
          type: "WRIT_QUOTE";
          entity: WritQuoteOut;
        };
  };

export type UrlLocatorView = UrlLocatorOut & {
  /** A key uniquely identifying a url locator relative to others. */
  key: string;
};
export interface MediaExcerptView extends MediaExcerptOut {
  citations: (MediaExcerptOut["citations"][number] & {
    /** A key uniquely identifying a citation relative to others. */
    key: string;
  })[];
  locators: MediaExcerptOut["locators"] & {
    urlLocators: UrlLocatorView[];
  };
  speakers: (MediaExcerptOut["speakers"][number] & {
    /** A key uniquely identifying a persorg relative to others. */
    key: string;
  })[];
}

export interface AppearanceView extends AppearanceOut {
  mediaExcerpt: MediaExcerptView;
}
