import {
  AppearanceOut,
  JustificationWithRootOut,
  MediaExcerptCitationOut,
  MediaExcerptOut,
  MediaExcerptSpeakerOut,
  PropositionCompoundAtomOut,
  PropositionCompoundOut,
  PropositionOut,
  StatementOut,
  UrlLocatorOut,
  WritQuoteOut,
} from "./apiModels";
import { PersistedEntity } from "./zodSchemas";

/** A view model where related entities have been replaced with their view model equivalent. */
export type JustificationView = Omit<
  JustificationWithRootOut,
  "target" | "basis" | "counterJustifications"
> & {
  counterJustifications?: (PersistedEntity | JustificationView)[];
} & (
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
  citations: MediaExcerptCitationView[];
  locators: MediaExcerptOut["locators"] & {
    urlLocators: UrlLocatorView[];
  };
  speakers: MediaExcerptSpeakerView[];
}
export type MediaExcerptCitationView = MediaExcerptCitationOut & {
  /** A key uniquely identifying a citation relative to others. */
  key: string;
};
export type MediaExcerptSpeakerView = MediaExcerptSpeakerOut & {
  /** A key uniquely identifying a persorg relative to others. */
  key: string;
};

export type PropositionCompoundAtomView = PropositionCompoundAtomOut & {
  /** A key uniquely identifying an atom relative to others. */
  key: string;
};

export interface PropositionCompoundView extends PropositionCompoundOut {
  atoms: PropositionCompoundAtomView[];
}

export interface AppearanceView extends AppearanceOut {
  mediaExcerpt: MediaExcerptView;
}
